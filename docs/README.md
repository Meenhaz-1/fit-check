# Documentation

This folder contains comprehensive documentation for the AI Wardrobe Assistant project.

## Quick Navigation

### Getting Started
- **[../README.md](../README.md)** - Main project overview, quick start guide

### Technical Documentation
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System design, data flow, evaluation framework
- **[API.md](API.md)** - REST API endpoint documentation with examples

### Phase 1 Reference (Historical)
- **[phase-1/](phase-1/)** - Sub-phase documentation from initial development
  - `PHASE_1_BUILD_PLAN.md` - Original development roadmap
  - `PHASE_1_TEST_PLAN.md` - Testing strategy
  - `PHASE_1_CONFIG.md` - Design decisions (v1)
  - `PHASE_1A_README.md` - Initial setup notes
  - `PHASE_1B_README.md` - Sub-phase 1b documentation
  - `PROJECT.md` - Original product requirements

## Document Purposes

### README.md
Entry point for new developers. Contains:
- Quick start instructions
- Project overview
- Basic architecture
- Development commands

### ARCHITECTURE.md
Deep dive into system design:
- Component architecture
- Data flow diagrams
- Extraction prompt strategy
- Evaluation framework details
- Design decisions & rationale

### API.md
Complete API reference:
- Endpoint specifications
- Request/response formats
- Error codes & handling
- Code examples (JavaScript, Python)
- Rate limiting & quotas

### phase-1/
Historical documentation from development phases. Reference only.

## MVP Focus

The current MVP focuses on **metadata extraction accuracy evaluation**:

1. Extract metadata from clothing images using OpenAI Vision API
2. Compare against ground truth using evaluation framework
3. Measure accuracy across 7 metadata fields
4. Identify improvement areas

See [ARCHITECTURE.md](ARCHITECTURE.md) for evaluation framework details.

## File Structure

```
docs/
├── README.md                 # This file
├── ARCHITECTURE.md           # System design & data flow
├── API.md                   # API endpoints & examples
└── phase-1/                 # Phase 1 reference materials
    ├── PHASE_1_BUILD_PLAN.md
    ├── PHASE_1_TEST_PLAN.md
    ├── PHASE_1_CONFIG.md
    ├── PHASE_1A_README.md
    ├── PHASE_1B_README.md
    └── PROJECT.md
```

## Next Steps

1. **Setup**: Follow steps in [../README.md](../README.md)
2. **Understand Design**: Read [ARCHITECTURE.md](ARCHITECTURE.md)
3. **Use APIs**: See [API.md](API.md) for endpoints
4. **Evaluate**: Run `python tests/eval_extraction_accuracy.py`

## Maintenance

- Keep README.md in sync with current project status
- Update ARCHITECTURE.md if system design changes
- Update API.md when endpoints change
- Archive old documentation in phase-1/ folder
