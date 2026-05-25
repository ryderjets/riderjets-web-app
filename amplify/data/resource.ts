import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'orderDocuments',
  access: (allow) => ({
    'documents/*': [
      allow.authenticated.to(['read', 'write', 'delete']),
    ],
  }),
});