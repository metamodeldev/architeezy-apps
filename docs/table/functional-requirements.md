# Functional Requirements: Architeezy Table

## Overview

This document outlines the high-level functional requirements for Architeezy Table.

## FR-1: Models

- **FR-1.1:** Load models from the repository via a selection interface.
- **FR-1.2:** Synchronize the matrix configuration with URL parameters for sharing.
- **FR-1.3:** Persist and restore the last-active session state and model selection.
- **FR-1.4:** Manage anonymous and authenticated access to model repositories.
- **FR-1.5:** Provide a library of saved matrix definitions and templates.

## FR-2: Builder

- **FR-2.1:** Construct matrix axes using multi-level hierarchical definitions.
- **FR-2.2:** Support multi-hop relationship traversal across architectural layers.
- **FR-2.3:** Specify relationship traversal direction (incoming or outgoing) for each level.
- **FR-2.4:** Filter entities by name within each level of the axis hierarchy.
- **FR-2.5:** Support transparent levels used for traversal logic but hidden from display.
- **FR-2.6:** Configure cell content to display presence, counts, or entity names.

## FR-3: Analysis

- **FR-3.1:** Render matrices with optional sticky headers for row and column axes.
- **FR-3.2:** Support both tabular and compact hierarchical layout modes.
- **FR-3.3:** Toggle the visibility of empty rows and columns for gap analysis.
- **FR-3.4:** Display subtotals and grand totals for hierarchical groups.
- **FR-3.5:** Manage expandable and collapsible hierarchical groups.
- **FR-3.6:** Sort matrix data alphabetically or numerically across both axes.
- **FR-3.7:** Support drill-down from cells to underlying entities or relationships.

## FR-4: Export

- **FR-4.1:** Export the matrix to CSV format.
- **FR-4.2:** Copy matrix data to the clipboard for compatibility with spreadsheet applications.

## Out of Scope

- **Model Authoring:** Creating, updating, or deleting entities and relationships.
- **Advanced UI Customization:** Manual styling of cells or custom visual themes.
- **Write-back:** Editing model data directly from the table.
- **Multi-model Analysis:** Querying multiple models within a single matrix.
