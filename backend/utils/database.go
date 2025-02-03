package utils

import (
	"database/sql"
	"strings"
)

// Safe query builder
type QueryBuilder struct {
	query  strings.Builder
	params []interface{}
}

func NewQueryBuilder() *QueryBuilder {
	return &QueryBuilder{}
}

func (qb *QueryBuilder) AddWhere(condition string, value interface{}) *QueryBuilder {
	if qb.query.Len() == 0 {
		qb.query.WriteString(" WHERE ")
	} else {
		qb.query.WriteString(" AND ")
	}
	qb.query.WriteString(condition)
	qb.params = append(qb.params, value)
	return qb
}

func (qb *QueryBuilder) Build() (string, []interface{}) {
	return qb.query.String(), qb.params
}

// Safe database operations
func SafeSelect(db *sql.DB, query string, params ...interface{}) (*sql.Rows, error) {
	stmt, err := db.Prepare(query)
	if err != nil {
		return nil, err
	}
	defer stmt.Close()
	
	return stmt.Query(params...)
}

func SafeExec(db *sql.DB, query string, params ...interface{}) (sql.Result, error) {
	stmt, err := db.Prepare(query)
	if err != nil {
		return nil, err
	}
	defer stmt.Close()
	
	return stmt.Exec(params...)
} 