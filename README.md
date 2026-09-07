# Railway Block Planning

AI-powered maintenance block planning system for Indian Railways.

**SIH Problem Statement:** SIH26027  
**Theme:** Transportation & Logistics

## Project Objective

The system is designed to support coordinated maintenance block planning across Engineering, Signal & Telecom, and Traction/OHE departments.

It will integrate maintenance requirements, defects, asset information, train movements, corridor availability, resources, and block requests to support efficient and explainable block planning.

## Planned Architecture

The project is organized into the following major components:

- `backend/` - FastAPI backend and application services
- `frontend/` - React/TypeScript web application
- `database/` - PostgreSQL schema, migrations, and seed data
- `optimizer/` - Constraint-based maintenance block planning
- `ml/` - Future machine-learning components
- `tests/` - Automated tests
- `docs/` - Architecture, API, and requirements documentation
- `.github/` - GitHub Actions and project automation

## Initial Development Scope

The first application workflow is the Department Request Portal.

A department user will be able to:

1. Create a maintenance/block request
2. Select the relevant section, location, and asset
3. Specify preferred timing and minimum duration
4. Specify block and resource requirements
5. Submit the request
6. Receive validation feedback
7. View request status
8. View conflicts and suggested windows

The request will then enter the central planning workflow.

## Safety Boundary

The prototype is a decision-support system.

It does not directly control railway signalling, OHE equipment, train movements, or safety-critical infrastructure.

Final operational authorization remains with the authorized railway operating process.

## Status

Early development.

Current focus:

**Department Request Portal → FastAPI → PostgreSQL → Smart Request Pre-Check**