
# DECODE CO-A QUIZEE: Git Workflow Diagram

## Overview

This document describes the Git workflow for the DECODE CO-A QUIZEE application development, including branching strategy, commit guidelines, and release process.

## Git Branching Strategy

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│             │     │             │     │             │
│   master    │────▶│   staging   │────▶│    dev      │
│   branch    │     │   branch    │     │   branch    │
│             │     │             │     │             │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                                               │
                                               │
                 ┌──────────────────┬─────────┴────────┬──────────────────┐
                 │                  │                  │                  │
           ┌─────▼─────┐      ┌─────▼─────┐      ┌─────▼─────┐      ┌─────▼─────┐
           │           │      │           │      │           │      │           │
           │ feature-1 │      │ feature-2 │      │ feature-3 │      │  hotfix   │
           │           │      │           │      │           │      │           │
           └─────┬─────┘      └─────┬─────┘      └─────┬─────┘      └─────┬─────┘
                 │                  │                  │                  │
                 └──────────────────┴──────────────────┴──────────────────┘
```

## Branch Types

1. **master**: Production branch with released code
2. **staging**: Pre-production testing environment
3. **dev**: Main development branch
4. **feature-***: Individual feature branches
5. **hotfix-***: Emergency bug fix branches

## Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Formatting, missing semi-colons, etc.
- **refactor**: Code changes that neither fix a bug nor add a feature
- **perf**: Performance improvements
- **test**: Adding or fixing tests
- **chore**: Changes to build process or auxiliary tools

### Example Commit Messages

```
feat(auth): implement teacher login functionality

Add email and password authentication for teacher accounts
with appropriate validation and error handling.

Closes #123
```

```
fix(quiz): resolve timer synchronization issue

Fixed the quiz timer to properly synchronize between client
and server to prevent timing discrepancies during quiz attempts.

Fixes #456
```

## Pull Request Process

1. Create a feature branch from dev
2. Implement and test changes
3. Submit PR to dev branch
4. Code review by at least one team member
5. Pass all automated tests
6. Merge to dev branch

## Release Process

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Feature    │    │    Dev      │    │  Staging    │    │   Master    │
│ Complete    │───▶│ Integration │───▶│  Testing    │───▶│  Release    │
│             │    │             │    │             │    │             │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

1. Merge all feature branches into dev
2. Create a release branch from dev
3. Deploy to staging environment
4. Perform QA testing
5. Fix any issues in the release branch
6. When approved, merge into master and tag with version
7. Deploy master to production

## Git Hooks

Pre-commit hooks are used to:
1. Run linting
2. Run unit tests
3. Check code formatting

## Versioning Scheme

The project uses Semantic Versioning (SemVer):

```
MAJOR.MINOR.PATCH
```

- **MAJOR**: Incompatible API changes
- **MINOR**: Backward-compatible functionality additions
- **PATCH**: Backward-compatible bug fixes
