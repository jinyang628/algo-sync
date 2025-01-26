import axios from 'axios';

import {
  AuthenticateRequest,
  AuthenticateResponse,
  authenticateResponseSchema,
} from '@/types/actions/users/authenticate';

import { SERVER_BASE_URL } from '@/lib/constants';

export async function authenticate(input: AuthenticateRequest): Promise<AuthenticateResponse> {
  try {
    const response = await axios.post(`${SERVER_BASE_URL}/api/v1/users/authenticate`, input);

    const authenticateResponse: AuthenticateResponse = authenticateResponseSchema.parse(
      response.data,
    );

    return authenticateResponse;
  } catch (error) {
    console.error('Error authenticating:', error);
    throw error;
  }
}
