use oxc_allocator::Allocator;
use oxc_parser::Parser;
use oxc_span::SourceType;

use crate::types::ParseResult;
use crate::analyzer::Analyzer;

pub fn parse_source(file_path: &str, source_code: &str) -> Result<ParseResult, String> {
    let allocator = Allocator::default();

    // Determine source type from file extension
    let source_type = if file_path.ends_with(".tsx") || file_path.ends_with(".ts") {
        SourceType::tsx()
    } else if file_path.ends_with(".jsx") {
        SourceType::jsx()
    } else {
        SourceType::default()
    };

    // Parse the source code
    let ret = Parser::new(&allocator, source_code, source_type).parse();
    let program = ret.program;
    let errors = ret.errors;

    if !errors.is_empty() {
        return Err(format!("Parse errors: {:?}", errors));
    }

    // Analyze the AST
    let mut analyzer = Analyzer::new(file_path.to_string());
    analyzer.analyze(&program);

    Ok(analyzer.into_result())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_simple_jsx() {
        let source = r#"
            import React from 'react';
            import { Button } from '@mui/material';

            export default function App() {
                return <Button variant="contained">Click me</Button>;
            }
        "#;

        let result = parse_source("test.tsx", source);
        assert!(result.is_ok());

        let parse_result = result.unwrap();
        // Should have at least one import source
        assert!(!parse_result.by_source.is_empty());
    }

    #[test]
    fn test_parse_invalid_syntax() {
        let source = "const x = {";
        let result = parse_source("test.tsx", source);
        assert!(result.is_err());
    }
}
