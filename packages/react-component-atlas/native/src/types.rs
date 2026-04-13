use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImportInfo {
    pub name: String,
    pub is_default: bool,
    pub line: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PropUsage {
    pub name: String,
    pub value: Option<String>,
    pub line: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UsageLocation {
    pub line: u32,
    pub col: u32,
    pub props: Vec<PropUsage>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ComponentData {
    pub name: String,
    pub import_info: ImportInfo,
    pub usages: Vec<UsageLocation>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImportSourceData {
    pub source: String,
    pub components: Vec<ComponentData>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParseResult {
    pub file_path: String,
    pub by_source: Vec<ImportSourceData>,
}

impl ParseResult {
    pub fn new(file_path: String) -> Self {
        Self {
            file_path,
            by_source: Vec::new(),
        }
    }

    /// Add a component usage, creating import source and component entries as needed
    pub fn add_usage(
        &mut self,
        component_name: String,
        import_source: String,
        is_default: bool,
        import_line: u32,
        usage_line: u32,
        usage_col: u32,
        props: Vec<PropUsage>,
    ) {
        // Find or create the import source
        let source_data = self.by_source.iter_mut().find(|s| s.source == import_source);

        let source_data = match source_data {
            Some(data) => data,
            None => {
                self.by_source.push(ImportSourceData {
                    source: import_source.clone(),
                    components: Vec::new(),
                });
                self.by_source.last_mut().unwrap()
            }
        };

        // Find or create the component
        let component_data = source_data
            .components
            .iter_mut()
            .find(|c| c.name == component_name);

        match component_data {
            Some(data) => {
                // Add usage to existing component
                data.usages.push(UsageLocation {
                    line: usage_line,
                    col: usage_col,
                    props,
                });
            }
            None => {
                // Create new component entry
                source_data.components.push(ComponentData {
                    name: component_name.clone(),
                    import_info: ImportInfo {
                        name: component_name,
                        is_default,
                        line: import_line,
                    },
                    usages: vec![UsageLocation {
                        line: usage_line,
                        col: usage_col,
                        props,
                    }],
                });
            }
        }
    }

    /// Track an import without usage (for completeness)
    pub fn add_import(
        &mut self,
        component_name: String,
        import_source: String,
        is_default: bool,
        import_line: u32,
    ) {
        // Find or create the import source
        let source_data = self.by_source.iter_mut().find(|s| s.source == import_source);

        let source_data = match source_data {
            Some(data) => data,
            None => {
                self.by_source.push(ImportSourceData {
                    source: import_source.clone(),
                    components: Vec::new(),
                });
                self.by_source.last_mut().unwrap()
            }
        };

        // Check if component already exists
        if source_data.components.iter().any(|c| c.name == component_name) {
            return; // Already tracked
        }

        // Create new component entry with no usages
        source_data.components.push(ComponentData {
            name: component_name.clone(),
            import_info: ImportInfo {
                name: component_name,
                is_default,
                line: import_line,
            },
            usages: Vec::new(),
        });
    }
}

impl Default for ParseResult {
    fn default() -> Self {
        Self::new(String::new())
    }
}

/// Helper struct for building the result during analysis
pub struct AnalysisState {
    pub file_path: String,
    /// Maps component name -> (source, is_default, line)
    pub imports: HashMap<String, (String, bool, u32)>,
    /// Temporary storage for usages before we link them
    pub pending_usages: Vec<PendingUsage>,
}

#[derive(Debug, Clone)]
pub struct PendingUsage {
    pub component_name: String,
    pub line: u32,
    pub col: u32,
    pub props: Vec<PropUsage>,
}

impl AnalysisState {
    pub fn new(file_path: String) -> Self {
        Self {
            file_path,
            imports: HashMap::new(),
            pending_usages: Vec::new(),
        }
    }

    /// Convert to final ParseResult by linking usages to imports
    pub fn into_result(self) -> ParseResult {
        let mut result = ParseResult::new(self.file_path);

        // First, add all imports
        for (component_name, (source, is_default, line)) in &self.imports {
            result.add_import(component_name.clone(), source.clone(), *is_default, *line);
        }

        // Then, add usages (they'll be linked to existing imports)
        for usage in self.pending_usages {
            if let Some((source, is_default, import_line)) = self.imports.get(&usage.component_name) {
                result.add_usage(
                    usage.component_name,
                    source.clone(),
                    *is_default,
                    *import_line,
                    usage.line,
                    usage.col,
                    usage.props,
                );
            } else {
                // No import found - this is a local component
                result.add_usage(
                    usage.component_name,
                    "<local>".to_string(),
                    false,
                    usage.line, // Use usage line as "import" line for local components
                    usage.line,
                    usage.col,
                    usage.props,
                );
            }
        }

        result
    }
}
