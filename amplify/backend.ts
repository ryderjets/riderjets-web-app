import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './resource';

defineBackend({
  auth,
  data,
  storage
});
