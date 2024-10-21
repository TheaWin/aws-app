const express = require('express');
const fileUpload = require('express-fileupload');
const fs = require('fs');
const path = require('path');
const { S3Client, ListObjectsV2Command, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');

const app = express();
const PORT = 3000;

// Middleware
app.use(fileUpload());
app.use(express.static('public'));

// S3 Client Configuration
const s3Client = new S3Client({
  region: 'us-east-1',
  endpoint: 'http://localhost:4566',
  forcePathStyle: true,
});

const UPLOAD_TEMP_PATH = path.join(__dirname, 'uploads');

// Create uploads directory if it doesn't exist
if (!fs.existsSync(UPLOAD_TEMP_PATH)) {
  fs.mkdirSync(UPLOAD_TEMP_PATH);
}

// Route to list images in the bucket
app.get('/images', async (req, res) => {
  const listObjectsParams = {
    Bucket: 'task-2-4-bucket',
  };

  try {
    const response = await s3Client.send(new ListObjectsV2Command(listObjectsParams));
    res.json(response); // Send the list of objects back as JSON
  } catch (error) {
    console.error('Error retrieving images:', error);
    res.status(500).send('Error retrieving images from S3.');
  }
});

// Route to upload an image to S3
app.post('/images', async (req, res) => {
  if (!req.files || !req.files.image) {
    return res.status(400).send('No files were uploaded.');
  }

  const file = req.files.image;
  const fileName = file.name.trim();
  const tempPath = path.join(UPLOAD_TEMP_PATH, fileName);

  console.log('Uploading file:  ', fileName);

  file.mv(tempPath, async (err) => {
    if (err) {
      return res.status(500).send(err);
    }

    const uploadParams = {
      Bucket: 'task-2-4-bucket',
      Key: fileName,
      Body: fs.createReadStream(tempPath),
    };

    try {
      const uploadCommand = new PutObjectCommand(uploadParams);
      await s3Client.send(uploadCommand);
      fs.unlinkSync(tempPath); // Clean up temp file after upload
      res.send('File uploaded to S3 successfully!');
    } catch (err) {
      console.error(err);
      res.status(500).send('Error uploading file to S3');
    }
  });
});

// Route to retrieve an individual file from S3
app.get('/images/:filename', async (req, res) => {
  const filename = req.params.filename.trim(); // Trim any whitespace or newlines

  const getObjectParams = {
      Bucket: 'task-2-4-bucket',
      Key: filename,
  };

  try {
      const data = await s3Client.send(new GetObjectCommand(getObjectParams));
      res.setHeader('Content-Type', data.ContentType);
      data.Body.pipe(res);
  } catch (error) {
      console.error('Error retrieving file:', error);
      res.status(500).send('Error retrieving file from S3.');
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
