# TC-1.2: Model Card Metadata Display

**System Requirement**: [SR-1.2](../../system-requirements/model.md)

## TC-1.2.1: Model cards display icon, name, type badge, and description

**Functional Requirements**: [FR-1.1](../../functional-requirements.md#fr-1-model-management)

### Preconditions

- Browser storage is empty; the "Select Model" modal is open
- The API returns two models: **e-commerce** (type **ApplicationArchitecture**, description
  "E-commerce platform components and flows") and **hr-system** (type **ApplicationArchitecture**,
  description "Human resources management system")

### Test Steps

1. Observe the **e-commerce** model card
   - **Expected**: The card shows an icon, the name **e-commerce**, a type badge
     **ApplicationArchitecture**, and the description "E-commerce platform components and flows"
2. Observe the **hr-system** model card
   - **Expected**: The card shows an icon, the name **hr-system**, a type badge
     **ApplicationArchitecture**, and the description "Human resources management system"

### Post-conditions

- Both model cards are visible with complete metadata

### Test Data

| Field        | Value                                    |
| ------------ | ---------------------------------------- |
| Model 1      | e-commerce (ApplicationArchitecture)     |
| Model 1 desc | E-commerce platform components and flows |
| Model 2      | hr-system (ApplicationArchitecture)      |
| Model 2 desc | Human resources management system        |
