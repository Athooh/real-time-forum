// Cache utility for posts
class PostCache {
    constructor() {
        this.CACHE_KEY = 'forum_posts_cache';
        this.CACHE_EXPIRY = 1000 * 60 * 5; // 5 minutes
    }

    async getCachedPosts() {
        const cached = localStorage.getItem(this.CACHE_KEY);
        if (cached) {
            const { posts, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < this.CACHE_EXPIRY) {
                return posts;
            }
        }
        return null;
    }

    async cachePosts(posts) {
        const cacheData = {
            posts,
            timestamp: Date.now()
        };
        localStorage.setItem(this.CACHE_KEY, JSON.stringify(cacheData));
    }

    clearCache() {
        localStorage.removeItem(this.CACHE_KEY);
    }
}

const postCache = new PostCache();