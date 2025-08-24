import { RequestHandler } from 'express';
import { createFailResponse, createSuccessResponse } from '@src/responses/index';
import * as yup from 'yup';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import envVars from '@src/config/environment';
import { GetObjectCommand, GetObjectCommandInput, S3Client } from '@aws-sdk/client-s3';

//#region GetImage Controller
/**
 * Query parameters for retrieving images
 * Supports two different query methods:
 * 1. jsonEquals: Find attachments by matching JSON data fields
 * 2. attachmentIdIn: Find attachments by specific IDs
 */
type GetImageLinkQuery = {
  jsonEquals?: string;
  attachmentIdIn?: string;
};

/**
 * Request body type (empty for GET requests)
 */
type GetImageRequestBody = {};

/**
 * Response structure - array of image objects with URL and name
 */
type GetImageResponse = {
  url: string; // Pre-signed AWS S3 URL for accessing the image
  name: string; // Human-readable name of the attachment
}[];

/**
 * Query parameters type for validation
 */
type GetImageQueryParams = {
  jsonEquals?: any;
  attachmentIdIn?: any;
};

/**
 * Validation schema for the getImage endpoint
 * Ensures at least one query parameter is provided
 */
export const getImageSchema: yup.SchemaOf<{
  query: GetImageQueryParams;
}> = yup.object({
  query: yup
    .object()
    .shape({
      // Optional URL-encoded JSON string for metadata-based searches
      jsonEquals: yup.string().optional(),
      // Optional URL-encoded JSON array of attachment IDs
      attachmentIdIn: yup.string().optional(),
    })
    .test({
      message: 'There must be at least one supported query',
      // Validation rule: at least one query parameter must be provided
      test: (obj: any) => obj.jsonEquals || obj.attachmentIdIn,
    }),
});

/**
 * GetImage Controller
 *
 * Purpose: Retrieves pre-signed URLs for images stored in AWS S3
 *
 * Functionality:
 * 1. Accepts two types of queries:
 *    - jsonEquals: Search by JSON metadata (e.g., car model, service type)
 *    - attachmentIdIn: Search by specific attachment IDs
 * 2. Queries the database for matching uploaded files
 * 3. Generates pre-signed S3 URLs for secure, temporary access
 * 4. Returns array of image objects with URLs and names
 *
 * Use Cases:
 * - Display car images in mobile app
 * - Show service completion photos
 * - Access user profile pictures
 * - Retrieve any uploaded attachments
 */
const getImage: RequestHandler<GetImageLinkQuery, GetImageResponse, GetImageRequestBody, GetImageQueryParams> = async (
  req,
  res,
  next,
) => {
  try {
    // ===== STEP 1: Parse and decode query parameters =====

    /**
     * Parse jsonEquals parameter
     * Expected format: URL-encoded JSON array of objects
     * Example: [{"carModel": "Toyota"}, {"serviceType": "wash"}]
     * Used for metadata-based searches in the JsonData field
     */
    const decodedJsonQuery: any[] = req.query.jsonEquals && JSON.parse(decodeURIComponent(req.query.jsonEquals));

    /**
     * Parse attachmentIdIn parameter
     * Expected format: URL-encoded JSON array of attachment IDs
     * Example: [1, 2, 3, 4]
     * Used for direct ID-based retrieval
     */
    const decodedAttachmentsIn: any[] =
      req.query.attachmentIdIn && JSON.parse(decodeURIComponent(req.query.attachmentIdIn));

    // ===== STEP 2: Query database for matching attachments =====

    /**
     * Database query using OR condition to support both query types:
     *
     * 1. JSON metadata search:
     *    - Maps through decodedJsonQuery array
     *    - For each JSON object, creates a path-based query
     *    - Searches JsonData field using Prisma's JSON path syntax
     *    - Example: JsonData.path["carModel"] equals "Toyota"
     *
     * 2. Direct ID search:
     *    - Uses AttachmentID in array syntax
     *    - Matches any attachment with ID in the provided array
     */
    const attachmentsFound = await req.prisma.uploadedFiles.findMany({
      where: {
        OR: [
          // JSON metadata-based search conditions
          ...(decodedJsonQuery?.map?.((json: any) => ({
            JsonData: {
              path: [Object.keys(json || {})?.[0]], // Get first key as path
              equals: json?.[Object.keys(json || {})?.[0]], // Get corresponding value
            },
          })) || []),
          // Direct ID-based search condition
          { AttachmentID: { in: decodedAttachmentsIn } },
        ],
      },
      select: {
        FileName: true, // S3 file key/name
        attachment: {
          select: {
            Name: true, // Human-readable attachment name
          },
        },
      },
    });

    // ===== STEP 3: Initialize AWS S3 client =====

    /**
     * Create S3 client with configured region
     * Uses environment variables for AWS configuration
     */
    const s3client = new S3Client({ region: envVars.aws.s3Region });

    // Initialize result array to store image data with URLs
    let result: GetImageResponse = [];

    // ===== STEP 4: Generate pre-signed URLs for each attachment =====

    /**
     * Process each found attachment:
     * 1. Create S3 GetObject command with file details
     * 2. Generate pre-signed URL with 30-second expiration
     * 3. Add to result array with name and URL
     */
    for (let attachment of attachmentsFound) {
      // Configure S3 GetObject parameters
      const params: GetObjectCommandInput = {
        Key: attachment.FileName, // S3 object key (file path)
        Bucket: envVars.aws.s3BucketName, // S3 bucket name from config
      };

      // Create S3 command for getting the object
      const command = new GetObjectCommand(params);

      /**
       * Generate pre-signed URL
       * - Allows temporary access without AWS credentials
       * - Expires in 30 seconds for security
       * - Can be used directly in HTML img tags or API calls
       */
      const url = await getSignedUrl(s3client, command, { expiresIn: 30 });

      // Add image data to result array
      result.push({
        name: attachment.attachment.Name, // Human-readable name from database
        url, // Pre-signed S3 URL
      });
    }

    // ===== STEP 5: Return successful response =====
    createSuccessResponse(req, res, result, next);
  } catch (error: any) {
    // ===== Error Handling =====
    /**
     * Catch and handle any errors:
     * - JSON parsing errors from malformed query parameters
     * - Database connection or query errors
     * - AWS S3 authentication or access errors
     * - Any other unexpected errors
     */
    createFailResponse(req, res, error, next);
  }
};
//#endregion

export default getImage;
