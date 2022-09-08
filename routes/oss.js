/////////////////////////////////////////////////////////////////////
// Copyright (c) Autodesk, Inc. All rights reserved
// Written by Forge Partner Development
//
// Permission to use, copy, modify, and distribute this software in
// object code form for any purpose and without fee is hereby granted,
// provided that the above copyright notice appears in all copies and
// that both that copyright notice and the limited warranty and
// restricted rights notice below appear in all supporting
// documentation.
//
// AUTODESK PROVIDES THIS PROGRAM "AS IS" AND WITH ALL FAULTS.
// AUTODESK SPECIFICALLY DISCLAIMS ANY IMPLIED WARRANTY OF
// MERCHANTABILITY OR FITNESS FOR A PARTICULAR USE.  AUTODESK, INC.
// DOES NOT WARRANT THAT THE OPERATION OF THE PROGRAM WILL BE
// UNINTERRUPTED OR ERROR FREE.
/////////////////////////////////////////////////////////////////////

const fs = require('fs');
const formidable = require('express-formidable');
const express = require('express');
const { BucketsApi, ObjectsApi, PostBucketsPayload } = require('forge-apis');

const { getClient, getInternalToken } = require('./common/oauth');
const config = require('../config');

let router = express.Router();

// Middleware for obtaining a token for each request.
router.use(async (req, res, next) => {
    const token = await getInternalToken();
    req.oauth_token = token;
    req.oauth_client = getClient();
    next();
});

// GET /api/forge/oss/buckets - expects a query param 'id'; if the param is '#' or empty,
// returns a JSON with list of buckets, otherwise returns a JSON with list of objects in bucket with given name.
router.get('/buckets', async (req, res, next) => {
    const bucket_name = req.query.id;
    if (!bucket_name || bucket_name === '#') {
        try {
            // Retrieve buckets from Forge using the [BucketsApi](https://github.com/Autodesk-Forge/forge-api-nodejs-client/blob/master/docs/BucketsApi.md#getBuckets)
            const buckets = await new BucketsApi().getBuckets({ limit: 64 }, req.oauth_client, req.oauth_token);
            res.json(buckets.body.items.map((bucket) => {
                return {
                    id: bucket.bucketKey,
                    // Remove bucket key prefix that was added during bucket creation
                    text: bucket.bucketKey.replace(config.credentials.client_id.toLowerCase() + '-', ''),
                    type: 'bucket',
                    children: true
                };
            }));
        } catch(err) {
            next(err);
        }
    } else {
        try {
            // Retrieve objects from Forge using the [ObjectsApi](https://github.com/Autodesk-Forge/forge-api-nodejs-client/blob/master/docs/ObjectsApi.md#getObjects)
            const objects = await new ObjectsApi().getObjects(bucket_name, {}, req.oauth_client, req.oauth_token);
            res.json(objects.body.items.map((object) => {
                return {
                    id: Buffer.from(object.objectId).toString('base64'),
                    text: object.objectKey,
                    type: 'object',
                    children: false
                };
            }));
        } catch(err) {
            next(err);
        }
    }
});

router.post('/upload', formidable(), async function (req, res, next) {
    const file = req.files.fileToUpload
    if (!file) {
        res.status(400).send('The required field ("model-file") is missing.');
        return;
    }
    try {
        await uploadObject(req.fields.bucketKey,file.name, file.path);
        res.status(200).end();
    } catch (err) {
        next(err);
    }
});

async function uploadObject(bucketKey,objectName, filePath) {
    const buffer = await fs.promises.readFile(filePath);
    const results = await new ObjectsApi().uploadResources(
        bucketKey,
        [{ objectKey: objectName, data: buffer }],
        { useAcceleration: false, minutesExpiration: 15 },
        null,
        await getInternalToken()
    );
    if (results[0].error) {
        throw results[0].completed;
    } else {
        return results[0].completed;
    }
}

module.exports = router;
