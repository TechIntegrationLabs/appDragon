import type { Handler } from '@netlify/functions';
import { getWebContainerInstance } from '../app/utils/webcontainer';

export const handler: Handler = async (event, context) => {
  try {
    const { path } = event;
    const webcontainer = await getWebContainerInstance();

    // Handle different API routes
    switch (path) {
      case '/api/download':
        // Handle download logic
        const files = await getAllProjectFiles(webcontainer);
        return {
          statusCode: 200,
          body: JSON.stringify(files),
          headers: {
            'Content-Type': 'application/json',
          },
        };

      case '/api/multiagent':
        // Handle multiagent logic
        return {
          statusCode: 200,
          body: JSON.stringify({ message: 'Multiagent endpoint' }),
          headers: {
            'Content-Type': 'application/json',
          },
        };

      default:
        return {
          statusCode: 404,
          body: JSON.stringify({ message: 'Not Found' }),
        };
    }
  } catch (error) {
    console.error('API Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error' }),
    };
  }
};
