// Test that activities import is working
// Run with: npx tsx test-activities-import.ts

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env') });

import { importFromDirectories } from './lib/importUtils';

const TEST_ACTIVITIES_DIR = path.join(__dirname, 'tmp', 'test-activities');
const TEST_ACTIVITY_FILE = 'Test Activity.md';
const TEST_ACTIVITY_CONTENT = `# Test Activity

This is a test activity for import verification.

## Instructions
1. Do something fun
2. Sing along
`;

async function setup() {
  // Create test activities directory
  if (!fs.existsSync(TEST_ACTIVITIES_DIR)) {
    fs.mkdirSync(TEST_ACTIVITIES_DIR, { recursive: true });
  }
  
  // Create a test activity file
  fs.writeFileSync(
    path.join(TEST_ACTIVITIES_DIR, TEST_ACTIVITY_FILE),
    TEST_ACTIVITY_CONTENT
  );
  
  console.log('✓ Created test activity file at:', path.join(TEST_ACTIVITIES_DIR, TEST_ACTIVITY_FILE));
}

async function testImport() {
  console.log('\n=== Testing Activities Import (Dry Run) ===\n');
  
  const config = {
    songsDirs: [],
    speechesDirs: [],
    activitiesDirs: [TEST_ACTIVITIES_DIR],
    programsDirs: [],
  };
  
  const { activityResults } = await importFromDirectories(
    config,
    true, // dry run first
    (type, result) => {
      console.log(`  [${type}] ${result.title} - ${result.status}`);
    }
  );
  
  console.log('\n=== Results ===');
  console.log(`Activities processed: ${activityResults.length}`);
  
  if (activityResults.length === 0) {
    console.log('\n❌ FAIL: No activities were processed!');
    console.log('   The activitiesDirs config is likely empty or the import function is not working.');
    return false;
  }
  
  const testActivity = activityResults.find(r => r.title === 'Test Activity');
  if (!testActivity) {
    console.log('\n❌ FAIL: Test Activity was not found in results!');
    console.log('   Processed activities:', activityResults.map(r => r.title));
    return false;
  }
  
  if (testActivity.status !== 'would-create' && testActivity.status !== 'exists') {
    console.log(`\n❌ FAIL: Test Activity has unexpected status: ${testActivity.status}`);
    return false;
  }
  
  console.log(`\n✓ SUCCESS: Test Activity was processed with status: ${testActivity.status}`);
  return true;
}

async function cleanup() {
  // Clean up test files
  if (fs.existsSync(TEST_ACTIVITIES_DIR)) {
    fs.rmSync(TEST_ACTIVITIES_DIR, { recursive: true });
    console.log('✓ Cleaned up test directory');
  }
}

async function main() {
  try {
    await setup();
    const success = await testImport();
    await cleanup();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('Error during test:', error);
    await cleanup();
    process.exit(1);
  }
}

main();
