const form = document.getElementById('upload-form');
const imagesDiv = document.getElementById('images');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = new FormData(form);
  try {
    const response = await fetch('/images', {
      method: 'POST',
      body: formData,
    });

    const result = await response.text();
    alert(result);
    form.reset();
    fetchImages(); // Fetch images after uploading
  } catch (error) {
    console.error('Error uploading image:', error);
  }
});

async function fetchImages() {
  try {
    const response = await fetch('/images');
    const data = await response.json();
    imagesDiv.innerHTML = ''; // Clear previous images

    if (data.Contents && data.Contents.length > 0) {
      data.Contents.forEach((item) => {
        // Create a clickable link for each file name
        const fileLink = document.createElement('a'); 
        fileLink.textContent = item.Key; // Set the text content to the file name
        fileLink.href = `/images/${item.Key}`; // Set href to the file URL
        fileLink.download = item.Key; // Set the download attribute to the filename

        // Append the link to the imagesDiv
        const fileNameDiv = document.createElement('div'); // Create a div for the file name
        fileNameDiv.appendChild(fileLink); // Append the link to the div
        imagesDiv.appendChild(fileNameDiv); // Append the div to the imagesDiv
      });
    } else {
      imagesDiv.textContent = 'No files uploaded yet.';
    }
  } catch (error) {
    console.error('Error fetching images:', error);
  }
}

// Initial fetch to display all images on page load
fetchImages();
