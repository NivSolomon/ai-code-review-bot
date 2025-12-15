# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package.json
COPY package.json ./

# Create standalone tsconfig.json (without monorepo dependencies)
RUN printf '{\n  "compilerOptions": {\n    "target": "ES2022",\n    "module": "commonjs",\n    "lib": ["ES2022"],\n    "declaration": true,\n    "declarationMap": true,\n    "sourceMap": true,\n    "outDir": "./dist",\n    "rootDir": "./src",\n    "strict": true,\n    "esModuleInterop": true,\n    "skipLibCheck": true,\n    "forceConsistentCasingInFileNames": true,\n    "resolveJsonModule": true,\n    "moduleResolution": "node",\n    "allowSyntheticDefaultImports": true,\n    "noUnusedLocals": true,\n    "noUnusedParameters": true,\n    "noImplicitReturns": true,\n    "noFallthroughCasesInSwitch": true,\n    "types": ["node"]\n  },\n  "include": ["src/**/*"],\n  "exclude": ["node_modules", "dist", "**/*.test.ts", "**/*.spec.ts"]\n}' > tsconfig.json

# Install dependencies
RUN npm install || (echo "Failed to install dependencies" && exit 1)

# Copy source files
COPY src ./src

# Build TypeScript to JavaScript
RUN npm run build || (echo "Failed to build" && exit 1)

# Runtime stage
FROM node:20-alpine AS runner

WORKDIR /app

# Copy package.json
COPY package.json ./

# Install only production dependencies
RUN npm install --omit=dev || (echo "Failed to install production dependencies" && exit 1)

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Expose the service port
EXPOSE 4001

# Run the application
CMD ["node", "dist/index.js"]
