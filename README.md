# Moon - Cloud Data Aggregator

Moon is a powerful cloud data aggregator that provides a unified interface for managing and monitoring resources across
multiple cloud providers including AWS, Google Cloud Platform (GCP), and Digital Ocean.

## Overview

Moon helps organizations consolidate their cloud infrastructure data into a single dashboard, enabling better visibility
and management. With support for two-factor authentication and role-based access control, Moon ensures secure access to
your cloud resources.

## Features

- **Multi-Cloud Support**: Aggregate data from AWS, GCP, and Digital Ocean
- **Secure Authentication**: Local authentication with email/password and SAML support
- **Two-Factor Authentication**: Enhanced security with 2FA
- **Role-Based Access Control**: Manage user permissions with different roles (root, admin, user)
- **Organization Management**: Group users and resources by organization
- **Service Configuration**: Manage different service types across cloud providers

## Technology Stack

- **Frontend**: Vue.js with TypeScript
- **Backend**: Node.js with Express
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT, SAML, and Two-Factor Authentication
- **Cloud Integrations**: AWS SDK, GCP and Digital Ocean APIs

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- PostgreSQL
- Docker (optional)

### Installation

1. Clone the repository:
    ```sh
    git clone https://github.com/lauramzarescu/moon-frontend.git
    cd moon-frontend
    ```

2. Install dependencies:
    ```sh
    npm install
    ```

3. Start the development server:
    ```sh
    npm run start-dev
    ```

### Docker Setup

You can also run Moon using Docker:

```sh
docker-compose up -d