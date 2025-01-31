// DOM Elements
const postsContainer = document.getElementById('posts-container');
const createPostButton = document.getElementById('create-post');

// Fetch and Display Posts
async function fetchPosts() {
    try {
        const response = await fetch('/posts');
        if (response.ok) {
            const posts = await response.json();
            renderPosts(posts);
        } else {
            console.error('Failed to fetch posts');
        }
    } catch (error) {
        console.error('Error fetching posts:', error);
    }
}

// Render Posts
function renderPosts(posts) {
    postsContainer.innerHTML = ''; // Clear existing posts
    posts.forEach((post) => {
        const postElement = document.createElement('div');
        postElement.classList.add('post');
        postElement.innerHTML = `
            <h3>${post.user.nickname}</h3>
            <p>${post.content}</p>
            <small>${new Date(post.timestamp).toLocaleString()}</small>
            <div class="comments"></div>
        `;
        postsContainer.appendChild(postElement);
    });
}

// Handle Post Creation
createPostButton.addEventListener('click', () => {
    const content = prompt('Enter your post content:');
    if (content) {
        createPost(content);
    }
});

async function createPost(content) {
    try {
        const response = await fetch('/posts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify({ content }),
        });

        if (response.ok) {
            fetchPosts(); // Refresh the post feed
        } else {
            console.error('Failed to create post');
        }
    } catch (error) {
        console.error('Error creating post:', error);
    }
}

// Initial Fetch of Posts
fetchPosts();