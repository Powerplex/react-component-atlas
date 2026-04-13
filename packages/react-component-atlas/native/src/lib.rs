#![deny(clippy::all)]

mod types;
mod parser;
mod analyzer;

use napi_derive::napi;

// NAPI-compatible types
#[derive(Debug)]
#[napi(object)]
pub struct ImportInfo {
  pub name: String,
  pub is_default: bool,
  pub line: u32,
}

#[derive(Debug)]
#[napi(object)]
pub struct PropUsage {
  pub name: String,
  pub value: Option<String>,
  pub line: u32,
}

#[derive(Debug)]
#[napi(object)]
pub struct UsageLocation {
  pub line: u32,
  pub col: u32,
  pub props: Vec<PropUsage>,
}

#[derive(Debug)]
#[napi(object)]
pub struct ComponentData {
  pub name: String,
  pub import_info: ImportInfo,
  pub usages: Vec<UsageLocation>,
}

#[derive(Debug)]
#[napi(object)]
pub struct ImportSourceData {
  pub source: String,
  pub components: Vec<ComponentData>,
}

#[derive(Debug)]
#[napi(object)]
pub struct ParseResult {
  pub file_path: String,
  pub by_source: Vec<ImportSourceData>,
}

// Conversion functions
impl From<types::ImportInfo> for ImportInfo {
  fn from(info: types::ImportInfo) -> Self {
    Self {
      name: info.name,
      is_default: info.is_default,
      line: info.line,
    }
  }
}

impl From<types::PropUsage> for PropUsage {
  fn from(prop: types::PropUsage) -> Self {
    Self {
      name: prop.name,
      value: prop.value,
      line: prop.line,
    }
  }
}

impl From<types::UsageLocation> for UsageLocation {
  fn from(loc: types::UsageLocation) -> Self {
    Self {
      line: loc.line,
      col: loc.col,
      props: loc.props.into_iter().map(|p| p.into()).collect(),
    }
  }
}

impl From<types::ComponentData> for ComponentData {
  fn from(data: types::ComponentData) -> Self {
    Self {
      name: data.name,
      import_info: data.import_info.into(),
      usages: data.usages.into_iter().map(|u| u.into()).collect(),
    }
  }
}

impl From<types::ImportSourceData> for ImportSourceData {
  fn from(data: types::ImportSourceData) -> Self {
    Self {
      source: data.source,
      components: data.components.into_iter().map(|c| c.into()).collect(),
    }
  }
}

impl From<types::ParseResult> for ParseResult {
  fn from(result: types::ParseResult) -> Self {
    Self {
      file_path: result.file_path,
      by_source: result.by_source.into_iter().map(|s| s.into()).collect(),
    }
  }
}

/// Parse a single React file and extract component usage information
#[napi]
pub fn parse_file(file_path: String, source_code: String) -> napi::Result<ParseResult> {
  parser::parse_source(&file_path, &source_code)
    .map(|r| r.into())
    .map_err(|e| napi::Error::from_reason(e))
}

/// Parse an entire React project and generate a component atlas
#[napi]
pub fn parse_project(project_root: String) -> napi::Result<String> {
  // TODO: Implement directory traversal and parsing
  Ok(serde_json::json!({
    "project_root": project_root,
    "message": "Full project parsing not yet implemented"
  }).to_string())
}
