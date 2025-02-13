import { renderPosts } from "../components/posts/posts.js";

function handleWebsocketUpdatePost(post) {
    if (post) {
        // Wrap the single post in an array
        renderPosts([post], true,true);
    }
}

export { handleWebsocketUpdatePost };