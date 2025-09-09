# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Farm Mall is a modern agricultural technology platform built with Next.js 14, TypeScript, and Tailwind CSS. It provides farm management capabilities including production cycle tracking, collaborator management, plant AI analysis, soil analysis, and yield calculations.

## Development Commands

```bash
# Development server
npm run dev

# Build for production  
npm run build

# Start production server
npm run start

# Linting
npm run lint
```

## Architecture Overview

### Application Structure
- **Next.js App Router**: Uses the modern app directory structure with server/client components
- **Authentication**: Custom JWT-based auth with refresh tokens, managed through `AuthProvider` context
- **State Management**: React Context for auth state, local state with useState/useEffect for components
- **API Integration**: Centralized API client (`lib/api/client.ts`) with Axios, includes token refresh and error handling
- **UI Components**: Radix UI primitives with custom styling in `components/ui/`

### Key Architectural Patterns

#### Authentication Flow
- `middleware.ts` handles route protection and token validation
- `lib/hooks/use-auth.tsx` provides auth context with user and farm data
- `lib/api/client.ts` handles token management, refresh, and API requests
- Tokens stored in both localStorage and httpOnly cookies for security

#### Component Architecture
- **Layout System**: `DashboardLayout` with sidebar providers for consistent UI
- **Shared Components**: Reusable components in `components/shared/` like collaborator lists, dashboard layouts
- **Feature Components**: Domain-specific components organized by feature (cycles, admin, user, modals)
- **UI Components**: Primitive components with consistent styling in `components/ui/`

#### Data Flow
- Farm data loaded through `useAuth` hook on app initialization
- API client handles all HTTP requests with automatic token refresh
- Components use local state for UI interactions, context for global state
- Type-safe interfaces defined in `lib/types/` for all data structures

### Farm Management System

#### Collaboration System
- **Roles**: admin, manager, family_member, worker, viewer with granular permissions
- **Invitations**: Email/phone-based invites with role assignments
- **Permissions**: Fine-grained access control for cycles, tasks, and financials

#### Production Cycles
- Full lifecycle management from planting to harvest
- Activity tracking with labor, inputs, and cost management
- Integration with crop varieties database and yield predictions

#### AI Integration
- Plant identification and health assessment using Gemini AI + Plant.id
- Soil analysis from document uploads
- Smart yield calculations with historical data

### Common Issues and Solutions

#### Modal Components
- All modals use Radix UI Dialog primitives
- Ensure proper state management with controlled open/close
- Check import paths and component exports when modals don't render
- Verify toast imports - use `useToast` hook consistently, not direct `toast` import

#### API Client Usage
- Always use `apiClient` instance, never create new Axios instances
- API responses are automatically unwrapped by interceptors
- Error handling includes user-friendly messages and retry logic
- Token refresh is automatic - don't handle manually in components

#### Type Safety
- All API responses have corresponding TypeScript interfaces
- Use proper types for collaborator roles, production statuses, etc.
- Import types from `lib/types/` not inline definitions

### Environment Configuration

Key environment variables:
- `NEXT_PUBLIC_API_BASE_URL`: Backend API endpoint
- Authentication tokens stored as `farm_mall_token` and `farm_mall_refresh_token`

### Styling Approach

- **Tailwind CSS** with custom agricultural color palette (agri-*, maize-*, sage-*)
- **Component Variants**: Using `class-variance-authority` for component styling
- **Responsive Design**: Mobile-first approach with proper touch targets
- **Theme Support**: Light theme by default, dark mode infrastructure present

### Testing Strategy

No test framework currently configured. When adding tests:
- Focus on API client functionality and authentication flows
- Test critical user paths like cycle creation and collaboration
- Mock API responses for consistent testing

### Performance Considerations

- Images are unoptimized (`next.config.mjs`) - consider optimization for production
- Large forms use proper React patterns to avoid unnecessary re-renders
- API client includes request/response logging for debugging

### Deployment Notes

- ESLint and TypeScript errors are ignored in build (`next.config.mjs`)
- Consider enabling these checks for production deployments
- Middleware handles authentication redirect logic