export const DUMMY_DATA = {
    posts: [
        {
            id: 1,
            user: {
                nickname: "JohnDoe",
                profession: "Developer",
                avatar: null
            },
            content: "Just finished building my first React application!",
            timestamp: new Date().toISOString(),
            category: "Technology",
            comments: []
        },
        {
            id: 2,
            user: {
                nickname: "JaneSmith",
                profession: "Designer",
                avatar: null
            },
            content: "Looking for feedback on my latest design project",
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            category: "Design",
            comments: []
        }
    ],
    onlineUsers: [
       
        {
            id: 1,
            nickname: "JohnDoe",
            avatar: "images/avatar.png",
            status: "online",
            lastMessage: {
                content: "Hey, how's it going?",
                timestamp: new Date(Date.now() - 1800000).toISOString()
            }
        },
        {
            id: 2,
            nickname: "JaneSmith",
            avatar: "images/avatar.png",
            status: "online",
            lastMessage: {
                content: "Did you see the new feature?",
                timestamp: new Date(Date.now() - 3600000).toISOString()
            }
        },
        {
            id: 3,
            nickname: "AliceJohnson",
            avatar: "images/avatar.png",
            status: "online",
            lastMessage: null
        }
    ]
}; 