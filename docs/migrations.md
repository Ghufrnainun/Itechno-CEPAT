# Database Architecture and Migrations Guide

## Overview

The CEPAT (Cari Entry Pekerjaan Area Terdekat) backend relies on a hybrid database management strategy. We utilize **Prisma ORM** for schema definition and migrations, coupled with **Supabase** for Authentication and Row Level Security (RLS). 

This document outlines the setup, architecture, and deployment procedures for our database layer.

## 1. Architecture Strategy

We separate concerns between Prisma and Supabase to maximize development efficiency and security:

- **Prisma (`prisma/schema.prisma`)**: Acts as the single source of truth for the `public` schema. It defines all tables, columns, constraints, and relationships. 
- **Supabase Auth (`auth.users`)**: Manages user credentials securely. The `public.User` table relies on an `auth_id` UUID column mapped to Supabase Auth instead of storing raw passwords.
- **Supabase SQL Migrations (`supabase/migrations/`)**: Contains pure SQL scripts for advanced PostgreSQL features that Prisma does not natively manage, specifically Row Level Security (RLS) policies and PostGIS extensions.

## 2. Security and Row Level Security (RLS)

All tables strictly enforce Row Level Security. Direct database mutations from the client side are highly restricted.
- **User Verification**: A helper function maps the Supabase JWT `auth.uid()` to the internal `User.id_user`.
- **Granular Access**: Users can only mutate their own records (e.g., Profiles, Tasks, Skills).
- **Escrow Transactions**: Financial transactions (`Transactions` table) reject direct insertion. They are securely handled via internal backend functions/triggers.

## 3. Local Development Setup

To initialize the database layer locally, execute the following steps:

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Variables**:
   Ensure you have a `.env` file at the project root with the correct database credentials:
   ```env
   DATABASE_URL="postgresql://[user]:[password]@[host]:6543/postgres?pgbouncer=true"
   DIRECT_URL="postgresql://[user]:[password]@[host]:5432/postgres"
   ```

3. **Apply Prisma Schema**:
   Synchronize your local Prisma client and apply the baseline schema structure:
   ```bash
   npx prisma migrate dev
   ```
   *(Note: This applies the schema up to the latest migration, including the secure `auth_id` mapping).*

4. **Apply Supabase Policies**:
   Apply the advanced RLS policies by executing the raw SQL directly to the database:
   ```bash
   npx prisma db execute --file=supabase/migrations/20260729_enable_rls.sql
   ```

## 4. Migration Workflow

When modifying the database schema in the future, adhere to the following workflow:

- **For Table/Column Changes**: Modify `prisma/schema.prisma` and run `npx prisma migrate dev` to generate a Prisma migration.
- **For Security/Policy Changes**: Do not place RLS logic in Prisma migrations. Instead, modify or create `.sql` scripts in `supabase/migrations/` and apply them manually or via the Supabase CLI.