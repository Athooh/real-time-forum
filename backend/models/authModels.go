package models

type User struct {
	ID         int     `json:"id"`
	Nickname   string  `json:"nickname"`
	Email      string  `json:"email"`
	Password   string  `json:"password"`
	FirstName  string  `json:"first_name"`
	LastName   string  `json:"last_name"`
	Age        int     `json:"age"`
	Gender     string  `json:"gender"`
	Profession string  `json:"profession"`
	Avatar     *string `json:"avatar"`
}

type LoginRequest struct {
	Identifier string `json:"identifier"`
	Password   string `json:"password"`
}
