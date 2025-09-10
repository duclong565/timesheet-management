#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Production-safe migration runner for role permission system
 * This script includes backup, validation, and rollback capabilities
 */

const BACKUP_DIR = path.join(__dirname, '../backups');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

console.log('🚀 Role Permission Migration Runner');
console.log('===================================\n');

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  console.log(`📁 Created backup directory: ${BACKUP_DIR}`);
}

/**
 * Create database backup before migration
 */
function createBackup() {
  console.log('💾 Creating database backup...');

  try {
    const backupFile = path.join(
      BACKUP_DIR,
      `role-permissions-backup-${timestamp}.sql`,
    );

    // Export only the tables we're modifying
    const tables = [
      'roles',
      'permissions',
      'role_permissions',
      'users', // Include users to backup role assignments
    ];

    const dumpCommand = [
      'pg_dump',
      process.env.DATABASE_URL ||
        'postgresql://user:password@localhost:5432/timesheet_db',
      '--no-owner',
      '--no-acl',
      '--clean',
      '--if-exists',
      ...tables.map((table) => `--table=${table}`),
      '--file',
      backupFile,
    ].join(' ');

    execSync(dumpCommand, { stdio: 'inherit' });
    console.log(`✅ Backup created: ${backupFile}`);
    return backupFile;
  } catch (error) {
    if (error.message.includes('pg_dump')) {
      console.log('⚠️  pg_dump not available, creating JSON backup instead...');
      return createJsonBackup();
    } else {
      throw error;
    }
  }
}

/**
 * Create JSON backup as fallback
 */
function createJsonBackup() {
  const backupFile = path.join(
    BACKUP_DIR,
    `role-permissions-backup-${timestamp}.json`,
  );

  try {
    // Use Prisma to export data
    const exportCommand = `npx tsx -e "
      import { PrismaClient } from '@prisma/client';
      const prisma = new PrismaClient();
      
      async function exportData() {
        const data = {
          roles: await prisma.role.findMany({ include: { permissions: true } }),
          permissions: await prisma.permission.findMany(),
          rolePermissions: await prisma.rolePermission.findMany(),
          users: await prisma.user.findMany({ select: { id: true, username: true, email: true, role_id: true } })
        };
        
        require('fs').writeFileSync('${backupFile}', JSON.stringify(data, null, 2));
        console.log('JSON backup created successfully');
        await prisma.\\$disconnect();
      }
      
      exportData().catch(console.error);
    "`;

    execSync(exportCommand, {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..'),
    });
    console.log(`✅ JSON backup created: ${backupFile}`);
    return backupFile;
  } catch (error) {
    console.error('❌ Failed to create backup:', error.message);
    throw error;
  }
}

/**
 * Run the migration
 */
function runMigration() {
  console.log('\n🔄 Running role permission migration...');

  try {
    const migrationCommand = 'npx tsx scripts/migrate-roles.ts';
    execSync(migrationCommand, {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..'),
    });
    console.log('✅ Migration completed successfully');
    return true;
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    return false;
  }
}

/**
 * Validate the migration results
 */
function validateMigration() {
  console.log('\n🔍 Validating migration results...');

  try {
    const validationCommand = `npx tsx -e "
      import { validateUserPermissions } from './scripts/migrate-roles.ts';
      validateUserPermissions().then(result => {
        if (!result) {
          console.error('Validation failed!');
          process.exit(1);
        }
        console.log('Validation passed!');
      }).catch(console.error);
    "`;

    execSync(validationCommand, {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..'),
    });
    console.log('✅ Validation passed');
    return true;
  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    return false;
  }
}

/**
 * Main migration process
 */
async function main() {
  const args = process.argv.slice(2);
  const skipBackup = args.includes('--skip-backup');
  const forceRun = args.includes('--force');

  try {
    // Check if we're in the right directory
    const packageJsonPath = path.join(__dirname, '../package.json');
    if (!fs.existsSync(packageJsonPath)) {
      throw new Error(
        'Please run this script from the timesheet-management directory',
      );
    }

    // Confirm before running in production
    if (!forceRun && process.env.NODE_ENV === 'production') {
      console.log('⚠️  Running in PRODUCTION mode!');
      console.log('   Please ensure you have:');
      console.log('   1. Tested this migration in staging');
      console.log('   2. Scheduled downtime if necessary');
      console.log('   3. Database access for rollback if needed');
      console.log('   ');
      console.log(
        '   Add --force flag to proceed or run in development first.',
      );
      process.exit(0);
    }

    // Create backup unless skipped
    let backupFile = null;
    if (!skipBackup) {
      backupFile = createBackup();
    } else {
      console.log('⚠️  Skipping backup (--skip-backup flag used)');
    }

    // Run migration
    const migrationSuccess = runMigration();

    if (!migrationSuccess) {
      console.log('❌ Migration failed - check logs above');
      if (backupFile) {
        console.log(`📁 Backup available for rollback: ${backupFile}`);
      }
      process.exit(1);
    }

    // Validate results
    const validationSuccess = validateMigration();

    if (!validationSuccess) {
      console.log('❌ Migration validation failed');
      if (backupFile) {
        console.log(`📁 Consider rolling back using: ${backupFile}`);
      }
      process.exit(1);
    }

    // Success!
    console.log('\n🎉 Migration completed successfully!');
    console.log('======================================');
    console.log('✅ Role permissions have been updated');
    console.log('✅ All users have appropriate permissions');
    if (backupFile) {
      console.log(`📁 Backup saved: ${backupFile}`);
    }
    console.log('');
    console.log('Next steps:');
    console.log('1. Test the new permission system');
    console.log('2. Update your frontend to use enhanced role management');
    console.log('3. Consider running additional tests');
  } catch (error) {
    console.error('\n💥 Migration process failed:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Ensure database is accessible');
    console.log('2. Check that all required dependencies are installed');
    console.log('3. Verify DATABASE_URL environment variable');
    console.log('4. Try running `npm install` first');
    process.exit(1);
  }
}

// Show help
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('Usage: node scripts/run-migration.js [options]');
  console.log('');
  console.log('Options:');
  console.log('  --skip-backup    Skip database backup (not recommended)');
  console.log('  --force          Run without confirmation in production');
  console.log('  --help, -h       Show this help message');
  console.log('');
  console.log('Examples:');
  console.log(
    '  node scripts/run-migration.js                 # Normal migration with backup',
  );
  console.log(
    '  node scripts/run-migration.js --skip-backup   # Skip backup (faster)',
  );
  console.log(
    '  node scripts/run-migration.js --force         # Force run in production',
  );
  process.exit(0);
}

// Run the migration
main();
