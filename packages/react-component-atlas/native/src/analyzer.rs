use oxc_ast::ast::{
    Program, ImportDeclaration, ImportDeclarationSpecifier,
    JSXElement, JSXOpeningElement, JSXAttributeItem,
};
use oxc_ast::Visit;
use oxc_ast::visit::walk::{walk_jsx_element, walk_import_declaration};
use oxc_span::GetSpan;

use crate::types::{AnalysisState, PendingUsage, PropUsage, ParseResult};

pub struct Analyzer {
    state: AnalysisState,
}

impl Analyzer {
    pub fn new(file_path: String) -> Self {
        Self {
            state: AnalysisState::new(file_path),
        }
    }

    pub fn analyze(&mut self, program: &Program) {
        self.visit_program(program);
    }

    pub fn into_result(self) -> ParseResult {
        self.state.into_result()
    }

    fn extract_jsx_component_name(&self, element: &JSXOpeningElement) -> Option<String> {
        match &element.name {
            oxc_ast::ast::JSXElementName::Identifier(ident) => {
                Some(ident.name.to_string())
            }
            oxc_ast::ast::JSXElementName::IdentifierReference(ident_ref) => {
                Some(ident_ref.name.to_string())
            }
            oxc_ast::ast::JSXElementName::MemberExpression(_member) => {
                // Handle cases like <MaterialUI.Button>
                // For now, just skip these
                None
            }
            _ => None,
        }
    }

    fn extract_props(&self, element: &JSXOpeningElement) -> Vec<PropUsage> {
        let mut props = Vec::new();

        for attr in &element.attributes {
            if let JSXAttributeItem::Attribute(attr_box) = attr {
                if let Some(name) = &attr_box.name.as_identifier() {
                    let prop_name = name.name.to_string();
                    let span = attr_box.span();

                    let value = attr_box.value.as_ref().and_then(|v| {
                        match v {
                            oxc_ast::ast::JSXAttributeValue::StringLiteral(s) => {
                                Some(s.value.to_string())
                            }
                            _ => Some("<expression>".to_string()),
                        }
                    });

                    props.push(PropUsage {
                        name: prop_name,
                        value,
                        line: span.start,
                    });
                }
            }
        }

        props
    }
}

impl<'a> Visit<'a> for Analyzer {
    fn visit_import_declaration(&mut self, decl: &ImportDeclaration<'a>) {
        let source = decl.source.value.to_string();
        let line = decl.span.start;

        // Extract actual imported names
        if let Some(specifiers) = &decl.specifiers {
            for specifier in specifiers.iter() {
                match specifier {
                    ImportDeclarationSpecifier::ImportDefaultSpecifier(spec) => {
                        let name = spec.local.name.to_string();
                        self.state.imports.insert(name, (source.clone(), true, line));
                    }
                    ImportDeclarationSpecifier::ImportSpecifier(spec) => {
                        let name = spec.local.name.to_string();
                        self.state.imports.insert(name, (source.clone(), false, line));
                    }
                    ImportDeclarationSpecifier::ImportNamespaceSpecifier(spec) => {
                        let name = spec.local.name.to_string();
                        self.state.imports.insert(name, (source.clone(), false, line));
                    }
                }
            }
        }

        // Continue walking
        walk_import_declaration(self, decl);
    }

    fn visit_jsx_element(&mut self, element: &JSXElement<'a>) {
        if let Some(component_name) = self.extract_jsx_component_name(&element.opening_element) {
            // Only track components that start with uppercase (React convention)
            if component_name.chars().next().map_or(false, |c| c.is_uppercase()) {
                let span = element.span();
                let props = self.extract_props(&element.opening_element);

                self.state.pending_usages.push(PendingUsage {
                    component_name,
                    line: span.start,
                    col: 0,
                    props,
                });
            }
        }

        // Important: call walk to continue traversing the tree
        walk_jsx_element(self, element);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use oxc_allocator::Allocator;
    use oxc_parser::Parser;
    use oxc_span::SourceType;

    #[test]
    fn test_basic_parsing() {
        let source = r#"
            import { Button } from '@mui/material';

            function App() {
                return <Button>Click</Button>;
            }
        "#;

        let allocator = Allocator::default();
        let ret = Parser::new(&allocator, source, SourceType::tsx()).parse();

        let mut analyzer = Analyzer::new("test.tsx".to_string());
        analyzer.analyze(&ret.program);

        let result = analyzer.into_result();

        // Should have one import source
        assert_eq!(result.by_source.len(), 1);
        assert_eq!(result.by_source[0].source, "@mui/material");

        // Should have Button component
        assert_eq!(result.by_source[0].components.len(), 1);
        assert_eq!(result.by_source[0].components[0].name, "Button");

        // Should have one usage
        assert_eq!(result.by_source[0].components[0].usages.len(), 1);
    }

    #[test]
    fn test_multiple_sources() {
        let source = r#"
            import { Button } from '@mui/material';
            import { Button as CustomButton } from './components';

            function App() {
                return (
                    <div>
                        <Button>MUI Button</Button>
                        <CustomButton>Custom Button</CustomButton>
                    </div>
                );
            }
        "#;

        let allocator = Allocator::default();
        let ret = Parser::new(&allocator, source, SourceType::tsx()).parse();

        let mut analyzer = Analyzer::new("test.tsx".to_string());
        analyzer.analyze(&ret.program);

        let result = analyzer.into_result();

        // Should have two import sources
        assert_eq!(result.by_source.len(), 2);

        // Find MUI source
        let mui_source = result.by_source.iter().find(|s| s.source == "@mui/material").unwrap();
        assert_eq!(mui_source.components[0].usages.len(), 1);

        // Find custom source
        let custom_source = result.by_source.iter().find(|s| s.source == "./components").unwrap();
        assert_eq!(custom_source.components[0].name, "CustomButton");
        assert_eq!(custom_source.components[0].usages.len(), 1);
    }

    #[test]
    fn test_extract_props() {
        let source = r#"
            import { Button } from '@mui/material';

            function App() {
                return <Button variant="contained" color="primary">Click</Button>;
            }
        "#;

        let allocator = Allocator::default();
        let ret = Parser::new(&allocator, source, SourceType::tsx()).parse();

        let mut analyzer = Analyzer::new("test.tsx".to_string());
        analyzer.analyze(&ret.program);

        let result = analyzer.into_result();
        let button_usage = &result.by_source[0].components[0].usages[0];

        assert_eq!(button_usage.props.len(), 2);
        assert_eq!(button_usage.props[0].name, "variant");
        assert_eq!(button_usage.props[0].value, Some("contained".to_string()));
    }

    #[test]
    fn test_unused_import() {
        let source = r#"
            import { Button, TextField } from '@mui/material';

            function App() {
                return <Button>Click</Button>;
            }
        "#;

        let allocator = Allocator::default();
        let ret = Parser::new(&allocator, source, SourceType::tsx()).parse();

        let mut analyzer = Analyzer::new("test.tsx".to_string());
        analyzer.analyze(&ret.program);

        let result = analyzer.into_result();

        // Should have 2 components (Button with usage, TextField without)
        assert_eq!(result.by_source[0].components.len(), 2);

        let button = result.by_source[0].components.iter().find(|c| c.name == "Button").unwrap();
        assert_eq!(button.usages.len(), 1);

        let textfield = result.by_source[0].components.iter().find(|c| c.name == "TextField").unwrap();
        assert_eq!(textfield.usages.len(), 0);
    }

    #[test]
    fn test_local_components() {
        let source = r#"
            import { Button } from '@mui/material';

            function LocalButton() {
                return <button>Local</button>;
            }

            function App() {
                return (
                    <div>
                        <Button>Imported</Button>
                        <LocalButton>Local</LocalButton>
                    </div>
                );
            }
        "#;

        let allocator = Allocator::default();
        let ret = Parser::new(&allocator, source, SourceType::tsx()).parse();

        let mut analyzer = Analyzer::new("test.tsx".to_string());
        analyzer.analyze(&ret.program);

        let result = analyzer.into_result();

        // Should have 2 sources: @mui/material and <local>
        assert_eq!(result.by_source.len(), 2);

        // Find imported Button
        let mui_source = result.by_source.iter().find(|s| s.source == "@mui/material").unwrap();
        assert_eq!(mui_source.components[0].name, "Button");
        assert_eq!(mui_source.components[0].usages.len(), 1);

        // Find local Button
        let local_source = result.by_source.iter().find(|s| s.source == "<local>").unwrap();
        assert_eq!(local_source.components[0].name, "LocalButton");
        assert_eq!(local_source.components[0].usages.len(), 1);
    }

    #[test]
    fn test_only_local_components() {
        let source = r#"
            function CustomCard() {
                return <div>Card</div>;
            }

            function App() {
                return <CustomCard />;
            }
        "#;

        let allocator = Allocator::default();
        let ret = Parser::new(&allocator, source, SourceType::tsx()).parse();

        let mut analyzer = Analyzer::new("test.tsx".to_string());
        analyzer.analyze(&ret.program);

        let result = analyzer.into_result();

        // Should have only 1 source: <local>
        assert_eq!(result.by_source.len(), 1);
        assert_eq!(result.by_source[0].source, "<local>");
        assert_eq!(result.by_source[0].components[0].name, "CustomCard");
        assert_eq!(result.by_source[0].components[0].usages.len(), 1);
    }
}
