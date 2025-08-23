# Frontend-Studio Contamination Audit Report

## Audit Summary
**Date**: August 24, 2025  
**Directory**: `/frontend-studio/`  
**Purpose**: Identify contamination and configuration issues before Vercel deployment

## ✅ CLEAN FILES (No Issues Found)
- **Core Application Files**: All `/src/` TypeScript/React files are clean
- **Configuration**: `package.json`, `tsconfig.json`, `vite.config.ts` are appropriate
- **Styling**: Tailwind and PostCSS configs are clean
- **Testing**: Test configuration files are appropriate

## ⚠️ CONTAMINATION ISSUES IDENTIFIED

### 1. **Wrong Backend URLs in Multiple Files**

#### `.env.production`
- **Current**: `https://veo3-backend-production-20250823-zx2n7dbbdq-uc.a.run.app`
- **Issue**: Points to old Cloud Run deployment from coral-muse project
- **Action Required**: Update to correct backend URL

#### `vercel.json`
- **Lines 10, 106, 140**: Contains `https://veo3-backend-production-20250823-zx2n7dbbdq-uc.a.run.app`
- **Issue**: Hardcoded wrong backend URL in multiple places
- **Action Required**: Update all instances to correct backend URL

#### Source Code Fallback URLs
The following files use `https://api.lostmindai.com` as fallback:
- `src/api/client.ts` (lines 25, 29)
- `src/api/types.ts` (line 4 - comment)
- `src/test/setup.ts` (line 6)
- `src/api/client.test.ts` (line 16)
- `src/test/integration/GenerateWorkflow.test.tsx` (lines 54, 55, 74, 75)

**Action Required**: Update fallback URLs in source code to match production backend

### 2. **Docker-Related Scripts in package.json**
Lines 20-21 contain Docker commands:
```json
"docker:build": "docker build -t veo3-frontend .",
"docker:run": "docker run -p 8080:8080 veo3-frontend",
```
**Issue**: Not needed for Vercel deployment  
**Action**: Can be removed to avoid confusion

### 3. **Lighthouse Scripts Referencing Wrong Domain**
Lines 23-25 reference `https://studio.lostmindai.com`:
```json
"lighthouse": "lighthouse https://studio.lostmindai.com ...",
"lighthouse:desktop": "lighthouse https://studio.lostmindai.com ...",
```
**Issue**: May point to wrong deployment  
**Action**: Update to correct production URL after deployment

## 🔧 RECOMMENDED ACTIONS

### Priority 1: Update Backend URLs
1. **Update `.env.production`**:
   ```
   VITE_API_URL=https://your-correct-backend-url.com
   ```

2. **Update `vercel.json`**:
   - Line 10: Update `VITE_API_URL` in env section
   - Line 106: Update API rewrite destination
   - Line 140: Update build env `VITE_API_URL`

3. **Update source code fallbacks**:
   - Replace `https://api.lostmindai.com` with correct backend URL
   - Or ensure environment variable is always set in Vercel

### Priority 2: Clean Unnecessary Files
1. **Remove Docker scripts** from `package.json` (lines 20-21)
2. **Update lighthouse scripts** to use correct domain

### Priority 3: Verify Configuration Consistency
1. Ensure all URL references point to the same backend
2. Remove any test-specific URLs from production code
3. Consider using environment variables exclusively (no hardcoded fallbacks)

## ✅ FILES CONFIRMED CLEAN
- No Dockerfile or docker-compose.yml found
- No nginx configuration files
- No deployment shell scripts
- No Cloud Run specific files
- No conflicting build configurations

## 📋 DEPLOYMENT CHECKLIST

Before deploying to Vercel:
- [ ] Update `.env.production` with correct backend URL
- [ ] Update all instances in `vercel.json` (3 locations)
- [ ] Update fallback URLs in source code (5 files)
- [ ] Remove Docker scripts from package.json (optional)
- [ ] Test build locally with `npm run build`
- [ ] Verify environment variables in Vercel dashboard match `.env.production`

## Conclusion
The frontend-studio directory is mostly clean with no major contamination from Cloud Run or Docker deployments. The main issue is incorrect backend URLs that need to be updated before deployment. Once these URLs are corrected, the application should deploy cleanly to Vercel.