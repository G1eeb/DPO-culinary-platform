"""ingredient amount column: numeric -> varchar

Revision ID: 0002
Revises: 0001
Create Date: 2026-06-18
"""
from alembic import op
import sqlalchemy as sa

revision = '0002'
down_revision = '0001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column(
        'ingredients',
        'amount',
        existing_type=sa.Numeric(10, 2),
        type_=sa.String(50),
        existing_nullable=True,
        postgresql_using='amount::text',
    )


def downgrade() -> None:
    op.alter_column(
        'ingredients',
        'amount',
        existing_type=sa.String(50),
        type_=sa.Numeric(10, 2),
        existing_nullable=True,
        postgresql_using='amount::numeric',
    )
