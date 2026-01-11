package repository

import (
	"context"
	"errors"

	"github.com/DopDopTeam/DopDocAI/auth-service/internal/models"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

type PGXUserRepository struct {
	DB *pgxpool.Pool
}

func NewPGXUserRepository(pool *pgxpool.Pool) *PGXUserRepository {
	return &PGXUserRepository{DB: pool}
}

// РЕШИЛИ НЕ ИСПОЛЬЗОВАТЬ USERNAME
// func (r *PGXUserRepository) GetByUsername(ctx context.Context, username string) (*models.User, error) {
// 	var user models.User

// 	err := r.DB.QueryRow(ctx,
// 		`select id,
// 		username,
// 		email,
// 		is_active,
// 		created_at,
// 		last_login_at
// 	from users where username = $1`, username).Scan(
// 		&user.ID,
// 		&user.Username,
// 		&user.Email,
// 		&user.IsActive,
// 		&user.CreatedAt,
// 		&user.LastLoginAt)

// 	if err != nil {
// 		if errors.Is(err, pgx.ErrNoRows) {
// 			return nil, nil
// 		}
// 		return nil, err
// 	}

// 	return &user, nil
// }

func (r *PGXUserRepository) GetByEmail(ctx context.Context, email string) (*models.User, error) {
	var user models.User

	err := r.DB.QueryRow(ctx,
		`select id,
		email,
		is_active,
		created_at,
		last_login_at
	from users where email = $1`, email).Scan(
		&user.ID,
		&user.Email,
		&user.IsActive,
		&user.CreatedAt,
		&user.LastLoginAt)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	return &user, nil
}

func (r *PGXUserRepository) GetByID(ctx context.Context, userID int64) (*models.User, error) {
	var user models.User
	err := r.DB.QueryRow(ctx,
		`select id, 
		email, 
		is_active, 
		created_at, 
		last_login_at
	from users where id = $1`, userID).Scan(
		&user.ID,
		&user.Email,
		&user.IsActive,
		&user.CreatedAt,
		&user.LastLoginAt)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	return &user, nil
}

func (r *PGXUserRepository) CreateUser(ctx context.Context, email, passHash string) (int64, error) {
	var userID int64
	err := r.DB.QueryRow(ctx,
		`insert into users 
		(email, 
		password_hash) 
		values ($1, $2) returning id`,
		email, passHash,
	).Scan(
		&userID)

	if err != nil {
		return userID, err
	}

	return userID, nil
}

func (r *PGXUserRepository) CheckPassword(ctx context.Context, userID int64, password string) (bool, error) {
	var hashedPassword string
	err := r.DB.QueryRow(ctx,
		`select password_hash from users where id = $1`, userID).Scan(&hashedPassword)

	if err != nil {
		return false, err
	}
	return compareHash(hashedPassword, password), nil
}

func compareHash(hashedPassword, password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(password))
	return err == nil
}
