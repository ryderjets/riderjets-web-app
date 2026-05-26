import { defineStorage } from '@aws-amplify/backend';


export const storage = defineStorage({
  name: 'amplifyDrive',
  access: (allow) => ({
    'profile-pictures/{entity_id}/*': [
      allow.guest.to(['read']),
      allow.entity('identity').to(['read', 'write', 'delete'])
    ],
    'picture-submissions/*': [
      allow.authenticated.to(['read','write']),
      allow.guest.to(['read', 'write'])
    ],
    'pods/*': [
      allow.authenticated.to(['read', 'write', 'delete']),
    ],
    'drivers/*': [
      allow.authenticated.to(['read', 'write', 'delete']),
    ],
  })
});