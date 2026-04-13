use oxc_allocator::Allocator;
use oxc_parser::Parser;
use oxc_span::SourceType;
use oxc_ast::Visit;

struct TestVisitor {
    jsx_count: usize,
}

impl<'a> Visit<'a> for TestVisitor {
    fn visit_jsx_element(&mut self, _element: &oxc_ast::ast::JSXElement<'a>) {
        println!("Found JSX element!");
        self.jsx_count += 1;
    }
}

fn main() {
    let source = r#"
        function App() {
            return <Button>Click</Button>;
        }
    "#;

    let allocator = Allocator::default();
    let ret = Parser::new(&allocator, source, SourceType::tsx()).parse();

    let mut visitor = TestVisitor { jsx_count: 0 };
    visitor.visit_program(&ret.program);
    
    println!("JSX count: {}", visitor.jsx_count);
}
