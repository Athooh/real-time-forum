// controllers/authController.go
package controllers

import (
	"database/sql"
	"testing"

	"forum/backend/controllers"
	"forum/backend/models"
	"forum/backend/utils"
)

func TestAuthController_RegisterUser(t *testing.T) {
	// Initialize logger for tests
	helper := utils.NewTestHelper(t)
	defer helper.Cleanup()

	// Setup test database
	testDB := utils.SetupTestDB(t)
	defer testDB.Cleanup()

	// Create auth controller
	ac := controllers.NewAuthController(testDB.DB)

	// Test cases
	tests := []struct {
		name    string
		user    models.User
		wantErr bool
	}{
		{
			name: "Valid registration",
			user: models.User{
				Nickname:  "newuser",
				Email:     "new@example.com",
				Password:  "Password123!",
				FirstName: "New",
				LastName:  "User",
				Age:       25,
				Gender:    "female",
			},
			wantErr: false,
		},
		{
			name: "Missing required fields",
			user: models.User{
				FirstName: "New",
				LastName:  "User",
			},
			wantErr: true,
		},
		{
			name: "Duplicate email",
			user: models.User{
				Nickname:  "anotheruser",
				Email:     "new@example.com", // Same email as first test case
				Password:  "Password123!",
				FirstName: "Another",
				LastName:  "User",
			},
			wantErr: true,
		},
		{
			name: "Invalid email format",
			user: models.User{
				Nickname:  "invaliduser",
				Email:     "invalid-email",
				Password:  "Password123!",
				FirstName: "Invalid",
				LastName:  "Email",
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			userID, err := ac.RegisterUser(tt.user)
			if (err != nil) != tt.wantErr {
				t.Errorf("AuthController.RegisterUser() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !tt.wantErr {
				if userID <= 0 {
					t.Errorf("AuthController.RegisterUser() returned invalid userID = %v", userID)
				}

				// Verify user was actually created
				var count int
				err := testDB.DB.QueryRow("SELECT COUNT(*) FROM users WHERE id = ?", userID).Scan(&count)
				if err != nil {
					t.Errorf("Failed to verify user creation: %v", err)
				}
				if count != 1 {
					t.Errorf("User was not created in database")
				}
			}
		})
	}
}

func TestAuthController_AuthenticateUser(t *testing.T) {
	// Initialize logger for tests
	helper := utils.NewTestHelper(t)
	defer helper.Cleanup()

	// Setup test database
	testDB := utils.SetupTestDB(t)
	defer testDB.Cleanup()

	// Create auth controller
	ac := controllers.NewAuthController(testDB.DB)

	// Create a test user in the database
	testUser := models.User{
		Nickname:  "testuser",
		Email:     "test@example.com",
		Password:  "Password123!",
		FirstName: "Test",
		LastName:  "User",
		Age:       30,
		Gender:    "male",
	}
	userID, err := ac.RegisterUser(testUser)
	if err != nil {
		t.Fatalf("Failed to create test user: %v", err)
	}

	tests := []struct {
		name    string
		args    models.LoginRequest
		want    *models.User
		wantErr bool
	}{
		{
			name: "Valid credentials",
			args: models.LoginRequest{
				Identifier: "test@example.com",
				Password:   "Password123!",
			},
			want: &models.User{
				ID:        int(userID),
				Nickname:  "testuser",
				Email:     "test@example.com",
				FirstName: "Test",
				LastName:  "User",
				Age:       30,
				Gender:    "male",
			},
			wantErr: false,
		},
		{
			name: "Invalid email",
			args: models.LoginRequest{
				Identifier: "nonexistent@example.com",
				Password:   "Password123!",
			},
			want:    nil,
			wantErr: true,
		},
		{
			name: "Invalid password",
			args: models.LoginRequest{
				Identifier: "test@example.com",
				Password:   "WrongPassword123!",
			},
			want:    nil,
			wantErr: true,
		},
		{
			name: "Empty email",
			args: models.LoginRequest{
				Identifier: "",
				Password:   "Password123!",
			},
			want:    nil,
			wantErr: true,
		},
		{
			name: "Empty password",
			args: models.LoginRequest{
				Identifier: "test@example.com",
				Password:   "",
			},
			want:    nil,
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := ac.AuthenticateUser(tt.args)
			if (err != nil) != tt.wantErr {
				t.Errorf("AuthController.AuthenticateUser() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if tt.want != nil {
				// Compare relevant fields since some fields like Password shouldn't be compared
				if got.ID != tt.want.ID ||
					got.Nickname != tt.want.Nickname ||
					got.Email != tt.want.Email ||
					got.FirstName != tt.want.FirstName ||
					got.LastName != tt.want.LastName ||
					got.Age != tt.want.Age ||
					got.Gender != tt.want.Gender {
					t.Errorf("AuthController.AuthenticateUser() = %v, want %v", got, tt.want)
				}
			} else if got != nil {
				t.Errorf("AuthController.AuthenticateUser() = %v, want nil", got)
			}
		})
	}
}

func TestGetUsernameByID(t *testing.T) {
	type args struct {
		db     *sql.DB
		userID int
	}
	// Initialize logger for tests
	helper := utils.NewTestHelper(t)
	defer helper.Cleanup()

	// Setup test database
	testDB := utils.SetupTestDB(t)
	defer testDB.Cleanup()

	// Create and insert test users
	testUsers := []models.User{
		{
			Nickname:  "testuser1",
			Email:     "test1@example.com",
			Password:  "Password123!",
			FirstName: "Test",
			LastName:  "User",
		},
		{
			Nickname:  "testuser2",
			Email:     "test2@example.com",
			Password:  "Password123!",
			FirstName: "Test",
			LastName:  "User",
		},
	}

	// Create auth controller and register test users
	ac := controllers.NewAuthController(testDB.DB)
	var userIDs []int
	for _, user := range testUsers {
		userID, err := ac.RegisterUser(user)
		if err != nil {
			t.Fatalf("Failed to create test user: %v", err)
		}
		userIDs = append(userIDs, int(userID))
	}

	tests := []struct {
		name    string
		args    args
		want    string
		wantErr bool
	}{
		{
			name: "Valid user ID",
			args: args{
				db:     testDB.DB,
				userID: userIDs[0],
			},
			want:    "testuser1",
			wantErr: false,
		},
		{
			name: "Another valid user ID",
			args: args{
				db:     testDB.DB,
				userID: userIDs[1],
			},
			want:    "testuser2",
			wantErr: false,
		},
		{
			name: "Non-existent user ID",
			args: args{
				db:     testDB.DB,
				userID: 99999,
			},
			want:    "",
			wantErr: true,
		},
		{
			name: "Invalid user ID (zero)",
			args: args{
				db:     testDB.DB,
				userID: 0,
			},
			want:    "",
			wantErr: true,
		},
		{
			name: "Invalid user ID (negative)",
			args: args{
				db:     testDB.DB,
				userID: -1,
			},
			want:    "",
			wantErr: true,
		},
		{
			name: "Nil database connection",
			args: args{
				db:     nil,
				userID: userIDs[0],
			},
			want:    "",
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := controllers.GetUsernameByID(tt.args.db, tt.args.userID)
			if (err != nil) != tt.wantErr {
				t.Errorf("GetUsernameByID() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if got != tt.want {
				t.Errorf("GetUsernameByID() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestAuthController_IsValidEmail(t *testing.T) {
	// Initialize logger for tests
	helper := utils.NewTestHelper(t)
	defer helper.Cleanup()

	type fields struct {
		DB *sql.DB
	}
	type args struct {
		email string
	}
	tests := []struct {
		name   string
		fields fields
		args   args
		want   bool
	}{
		{
			name:   "Valid email with common domain",
			fields: fields{DB: nil}, // DB not needed for email validation
			args:   args{email: "user@example.com"},
			want:   true,
		},
		{
			name:   "Valid email with subdomain",
			fields: fields{DB: nil},
			args:   args{email: "user@sub.example.com"},
			want:   true,
		},
		{
			name:   "Valid email with numbers",
			fields: fields{DB: nil},
			args:   args{email: "user123@example.com"},
			want:   true,
		},
		{
			name:   "Valid email with special characters",
			fields: fields{DB: nil},
			args:   args{email: "user.name+tag@example.com"},
			want:   true,
		},
		{
			name:   "Empty email",
			fields: fields{DB: nil},
			args:   args{email: ""},
			want:   false,
		},
		{
			name:   "Missing @ symbol",
			fields: fields{DB: nil},
			args:   args{email: "userexample.com"},
			want:   false,
		},
		{
			name:   "Missing domain",
			fields: fields{DB: nil},
			args:   args{email: "user@"},
			want:   false,
		},
		{
			name:   "Missing local part",
			fields: fields{DB: nil},
			args:   args{email: "@example.com"},
			want:   false,
		},
		{
			name:   "Invalid characters in local part",
			fields: fields{DB: nil},
			args:   args{email: "user<>@example.com"},
			want:   false,
		},
		{
			name:   "Multiple @ symbols",
			fields: fields{DB: nil},
			args:   args{email: "user@domain@example.com"},
			want:   false,
		},
		{
			name:   "Invalid domain format",
			fields: fields{DB: nil},
			args:   args{email: "user@.com"},
			want:   false,
		},
		{
			name:   "Space in email",
			fields: fields{DB: nil},
			args:   args{email: "user name@example.com"},
			want:   false,
		},
	}

	// Create auth controller with nil DB since it's not needed for email validation
	ac := controllers.NewAuthController(nil)

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := ac.IsValidEmail(tt.args.email); got != tt.want {
				t.Errorf("AuthController.IsValidEmail() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestAuthController_IsValidUsername(t *testing.T) {
	// Initialize logger for tests
	helper := utils.NewTestHelper(t)
	defer helper.Cleanup()

	type fields struct {
		DB *sql.DB
	}
	type args struct {
		username string
	}
	tests := []struct {
		name   string
		fields fields
		args   args
		want   bool
	}{
		{
			name:   "Valid username with letters",
			fields: fields{DB: nil}, // DB not needed for username validation
			args:   args{username: "johndoe"},
			want:   true,
		},
		{
			name:   "Valid username with numbers",
			fields: fields{DB: nil},
			args:   args{username: "user123"},
			want:   true,
		},
		{
			name:   "Valid username with underscore",
			fields: fields{DB: nil},
			args:   args{username: "john_doe"},
			want:   true,
		},
		{
			name:   "Valid username minimum length",
			fields: fields{DB: nil},
			args:   args{username: "abc"},
			want:   true,
		},
		{
			name:   "Valid username maximum length",
			fields: fields{DB: nil},
			args:   args{username: "abcdefghijklmnopqrst"}, // 20 characters
			want:   true,
		},
		{
			name:   "Empty username",
			fields: fields{DB: nil},
			args:   args{username: ""},
			want:   false,
		},
		{
			name:   "Username too short",
			fields: fields{DB: nil},
			args:   args{username: "ab"},
			want:   false,
		},
		{
			name:   "Username too long",
			fields: fields{DB: nil},
			args:   args{username: "abcdefghijklmnopqrstu"}, // 21 characters
			want:   false,
		},
		{
			name:   "Username with spaces",
			fields: fields{DB: nil},
			args:   args{username: "john doe"},
			want:   false,
		},
		{
			name:   "Username with special characters",
			fields: fields{DB: nil},
			args:   args{username: "john@doe"},
			want:   false,
		},
		{
			name:   "Username with uppercase letters",
			fields: fields{DB: nil},
			args:   args{username: "JohnDoe"},
			want:   false,
		},
		{
			name:   "Username starting with number",
			fields: fields{DB: nil},
			args:   args{username: "1john"},
			want:   false,
		},
		{
			name:   "Username starting with underscore",
			fields: fields{DB: nil},
			args:   args{username: "_john"},
			want:   false,
		},
	}

	// Create auth controller with nil DB since it's not needed for username validation
	ac := controllers.NewAuthController(nil)

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := ac.IsValidUsername(tt.args.username); got != tt.want {
				t.Errorf("AuthController.IsValidUsername() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestAuthController_IsValidPassword(t *testing.T) {
	// Initialize logger for tests
	helper := utils.NewTestHelper(t)
	defer helper.Cleanup()

	type fields struct {
		DB *sql.DB
	}
	type args struct {
		password string
	}
	tests := []struct {
		name   string
		fields fields
		args   args
		want   bool
	}{
		{
			name:   "Valid password with all requirements",
			fields: fields{DB: nil}, // DB not needed for password validation
			args:   args{password: "Password123!"},
			want:   true,
		},
		{
			name:   "Valid password with minimum requirements",
			fields: fields{DB: nil},
			args:   args{password: "Pass123!"},
			want:   true,
		},
		{
			name:   "Valid password with complex characters",
			fields: fields{DB: nil},
			args:   args{password: "P@ssw0rd#$%123"},
			want:   true,
		},
		{
			name:   "Empty password",
			fields: fields{DB: nil},
			args:   args{password: ""},
			want:   false,
		},
		{
			name:   "Password too short",
			fields: fields{DB: nil},
			args:   args{password: "Pass1!"},
			want:   false,
		},
		{
			name:   "Password without uppercase",
			fields: fields{DB: nil},
			args:   args{password: "password123!"},
			want:   false,
		},
		{
			name:   "Password without lowercase",
			fields: fields{DB: nil},
			args:   args{password: "PASSWORD123!"},
			want:   false,
		},
		{
			name:   "Password without numbers",
			fields: fields{DB: nil},
			args:   args{password: "Password!!"},
			want:   false,
		},
		{
			name:   "Password without special characters",
			fields: fields{DB: nil},
			args:   args{password: "Password123"},
			want:   false,
		},
		{
			name:   "Password with spaces",
			fields: fields{DB: nil},
			args:   args{password: "Password 123!"},
			want:   false,
		},
		{
			name:   "Password too long",
			fields: fields{DB: nil},
			args:   args{password: "Password123!Password123!Password123!Password123!"},
			want:   false,
		},
	}

	// Create auth controller with nil DB since it's not needed for password validation
	ac := controllers.NewAuthController(nil)

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := ac.IsValidPassword(tt.args.password); got != tt.want {
				t.Errorf("AuthController.IsValidPassword() = %v, want %v", got, tt.want)
			}
		})
	}
}
