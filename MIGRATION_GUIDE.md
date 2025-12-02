# Migration Guide: Yeps to Express

This guide will help you migrate your server code from yeps to Express.

## Why the Change?

The yeps-router package had a critical vulnerability (path-to-regexp) that couldn't be fixed without breaking changes. Express is more widely used, better maintained, and has a larger community.

## Installation

Already included in package.json:
- express@^4.21.2
- body-parser@^1.20.3
- cors@^2.8.5
- compression@^1.7.5

## Basic Server Setup

### Old (yeps)
```javascript
const App = require('yeps');
const Router = require('yeps-router');
const serve = require('yeps-static');
const error = require('yeps-error');
const graphql = require('yeps-graphql');

const app = new App();

app.then(error());
app.then(serve('./dist'));
app.then(Router());

app.listen(3000);
```

### New (Express)
```javascript
const express = require('express');
const path = require('path');
const compression = require('compression');
const cors = require('cors');

const app = express();

// Middleware
app.use(compression());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, '../dist')));

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

## Routing

### Old (yeps)
```javascript
const Router = require('yeps-router');

module.exports = () => {
  const router = Router();
  
  router.get('/api/users', async (ctx) => {
    ctx.res.body = { users: [] };
  });
  
  router.post('/api/users', async (ctx) => {
    const data = await ctx.req.body;
    ctx.res.body = { created: true };
  });
  
  return router;
};
```

### New (Express)
```javascript
const express = require('express');
const router = express.Router();

router.get('/api/users', async (req, res) => {
  res.json({ users: [] });
});

router.post('/api/users', async (req, res) => {
  const data = req.body;
  res.json({ created: true });
});

module.exports = router;
```

## GraphQL

### Old (yeps-graphql)
```javascript
const graphql = require('yeps-graphql');
const schema = require('./schema');

app.then(graphql({ schema }));
```

### New (express-graphql or Apollo Server)
```bash
npm install express-graphql graphql
```

```javascript
const { graphqlHTTP } = require('express-graphql');
const schema = require('./schema');

app.use('/graphql', graphqlHTTP({
  schema: schema,
  graphiql: process.env.NODE_ENV === 'development'
}));
```

## Middleware

### Old (yeps middleware)
```javascript
app.then(async (ctx) => {
  await next();
  // middleware logic
});
```

### New (Express middleware)
```javascript
app.use((req, res, next) => {
  // middleware logic
  next();
});
```

## Context vs Request/Response

### Yeps Context
```javascript
app.then(async (ctx) => {
  // Request
  const method = ctx.req.method;
  const url = ctx.req.url;
  const headers = ctx.req.headers;
  const body = await ctx.req.body;
  
  // Response
  ctx.res.status = 200;
  ctx.res.body = { data: 'value' };
});
```

### Express Request/Response
```javascript
app.use((req, res) => {
  // Request
  const method = req.method;
  const url = req.url;
  const headers = req.headers;
  const body = req.body; // Already parsed by middleware
  
  // Response
  res.status(200).json({ data: 'value' });
});
```

## Static Files

### Old (yeps-static)
```javascript
const serve = require('yeps-static');
app.then(serve('./dist'));
```

### New (Express static)
```javascript
const path = require('path');
app.use(express.static(path.join(__dirname, '../dist')));
```

## Error Handling

### Old (yeps-error)
```javascript
const error = require('yeps-error');
app.then(error());
```

### New (Express error middleware)
```javascript
// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler (must be last)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});
```

## Complete Example

Here's a complete server/index.js file:

```javascript
const express = require('express');
const path = require('path');
const compression = require('compression');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(compression());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Static files - serve React app
app.use(express.static(path.join(__dirname, '../dist')));

// Handle React routing - return index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack 
    })
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
```

## Testing

### Old (with yeps)
```javascript
const request = require('supertest');
const App = require('yeps');

describe('API', () => {
  it('should return users', async () => {
    const app = new App();
    // ... setup
    const res = await request(app.listen())
      .get('/api/users');
    expect(res.status).to.equal(200);
  });
});
```

### New (with Express)
```javascript
const request = require('supertest');
const app = require('../server');

describe('API', () => {
  it('should return users', async () => {
    const res = await request(app)
      .get('/api/users');
    expect(res.status).to.equal(200);
  });
});
```

## Common Patterns

### Authentication Middleware
```javascript
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  // Verify token logic here
  // jwt.verify(token, process.env.SECRET, (err, user) => {
  //   if (err) return res.sendStatus(403);
  //   req.user = user;
  //   next();
  // });
  
  next();
};

app.use('/api/protected', authenticateToken);
```

### Rate Limiting
```bash
npm install express-rate-limit
```

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

### Request Validation
```bash
npm install express-validator
```

```javascript
const { body, validationResult } = require('express-validator');

app.post('/api/users',
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // Process request
  }
);
```

## Resources

- [Express Documentation](https://expressjs.com/)
- [Express Middleware](https://expressjs.com/en/guide/using-middleware.html)
- [Express Routing](https://expressjs.com/en/guide/routing.html)
- [Express Error Handling](https://expressjs.com/en/guide/error-handling.html)

## Next Steps

1. Create/update `server/index.js` with Express code
2. Move route handlers to separate files
3. Update tests to work with Express
4. Test the application thoroughly
5. Update documentation

## Need Help?

If you encounter issues during migration:
1. Check Express documentation
2. Review error messages carefully
3. Test each route individually
4. Use Postman or curl to test APIs
5. Check server logs

Good luck with the migration! 🚀
