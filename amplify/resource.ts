// This file is not needed. The storage configuration has been moved to amplify/storage/resource.ts.
// You can safely delete this file.

import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'amplifyDrive',
  access: (allow) => ({
    'orders/*': [
      allow.authenticated.to(['read', 'write', 'delete'])
    ]
  })
});