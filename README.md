# Mantis NPM Package

## Overview

Mantis is an SDK that enables developers to seamlessly track microservice metrics on the Mantis dashboard with minimal setup. It provides an easy-to-use client for manual metric tracking and an Express.js middleware for automatic tracking.

## Features

- **Lightweight**: Easy integration with your backend.
- **Flexible Authentication**: Supports both API key authentication and OAuth tokens (Google/GitHub).
- **Automatic & Manual Tracking**: Track metrics manually via the SDK or automatically via Express middleware.
- **Custom Metrics**: Define and track your own metrics for detailed insights.
- **Preconfigured**: No need to set up Prometheus, InfluxDB, or Grafana.
- **Environment-Based Configuration**: API keys, OAuth tokens, and endpoints are securely stored in environment variables.

## Installation

```sh
npm install mantis-sdk
```

## Usage

### 1. Client-Based Metric Tracking

```typescript
import MantisClient from 'mantis-sdk';

const client = new MantisClient({
  apiKey: process.env.MANTIS_API_KEY, // For API Key authentication
  token: process.env.USER_OAUTH_TOKEN, // For OAuth authentication (optional)
  authProvider: 'google', // or 'github' if using OAuth
});

client.sendMetric('requests_per_second', 5.3);
```

### 2. Express Middleware for Automatic Tracking

The middleware allows you to automatically track key metrics with minimal setup.

```typescript
import express from 'express';
import { mantisMiddleware } from 'mantis-sdk';

const app = express();

app.use(
  mantisMiddleware({
    apiKey: process.env.MANTIS_API_KEY, // For API Key authentication
    token: process.env.USER_OAUTH_TOKEN, // For OAuth authentication (optional)
    authProvider: 'google', // or 'github' if using OAuth
  })
);

app.get('/', (req, res) => {
  res.send('Hello, Mantis!');
});

app.listen(3000, () => console.log('Server running on port 3000'));
```

## Configuration

### Environment Variables

| Variable           | Description                                       | Default                               |
| ------------------ | ------------------------------------------------- | ------------------------------------- |
| `MANTIS_API_KEY`   | API key for authentication (required if no OAuth) | None                                  |
| `USER_OAUTH_TOKEN` | OAuth token for authentication (if using OAuth)   | None                                  |
| `AUTH_PROVIDER`    | OAuth provider (`google` or `github`)             | None                                  |
| `MANTIS_API_URL`   | API endpoint for sending metrics                  | `https://mantis-backend.onrender.com` |

### Setting Environment Variables

#### For Local Development (`.env` file)

Create a `.env` file in your project root:

```
MANTIS_API_KEY=your-generated-api-key
MANTIS_API_URL=https://mantis-backend.onrender.com
```

If using OAuth:

```
USER_OAUTH_TOKEN=your-oauth-token
AUTH_PROVIDER=google
```

Then, load it using `dotenv`:

```typescript
import dotenv from 'dotenv';
dotenv.config();
```

#### For Deployment (Netlify, Vercel, AWS, etc.)

Set `MANTIS_API_KEY` or `USER_OAUTH_TOKEN` in your hosting provider’s environment variables section.

## Defining Custom Metrics

To track custom metrics, define metric functions that receive the request, response, and a start timestamp:

```typescript
const customMetric = async (req, res, start) => {
  const duration = process.hrtime(start);
  const latency = duration[0] * 1000 + duration[1] / 1e6; // Convert to milliseconds
  return { name: 'custom_latency_ms', value: latency };
};
```

Pass your custom metrics as an array to `mantisMiddleware`:

```typescript
app.use(
  mantisMiddleware({
    apiKey: process.env.MANTIS_API_KEY,
    metrics: [customMetric],
  })
);
```

## Supported Metrics in Grafana

Currently, the Mantis Grafana dashboard is configured to track the following metrics:

- `latency_ms` (Response time in milliseconds)
- `requests_per_second` (Number of requests per second)
- `error_rate` (Percentage of failed requests)

Custom metrics can be sent via the SDK, but they are **not yet visualized in Grafana**. Future updates may include support for dynamic metric visualization.

## Testing the NPM Package

To test Mantis, you can use the provided tester project, which simulates a microservice using K6 and WireMock.

### 1. Clone the Tester Project

```sh
git clone https://github.com/your-repo/mantis-tester.git
cd mantis-tester
```

### 2. Install Dependencies

```sh
npm install
```

### 3. Set Your API Key or OAuth Token in `.env`

```sh
MANTIS_API_KEY=your-generated-api-key
USER_OAUTH_TOKEN=your-oauth-token
```

### 4. Run WireMock (API Mocking)

```sh
npm run wiremock
```

### 5. Run K6 Load Testing

```sh
npm run test-load
```

## License

This project is licensed under the MIT License.
