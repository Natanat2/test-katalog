"""Add users table and cart owner relation

Revision ID: 20260405_0002
Revises: 20260405_0001
Create Date: 2026-04-05 21:00:00.000000
"""

from typing import Sequence

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "20260405_0002"
down_revision: str | None = "20260405_0001"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("email", sa.String(length=320), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.add_column("carts", sa.Column("owner_user_id", sa.Integer(), nullable=True))
    op.create_index("ix_carts_owner_user_id", "carts", ["owner_user_id"], unique=False)
    op.create_unique_constraint("uq_carts_owner_user_id", "carts", ["owner_user_id"])
    op.create_foreign_key(
        "fk_carts_owner_user_id_users",
        "carts",
        "users",
        ["owner_user_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint("fk_carts_owner_user_id_users", "carts", type_="foreignkey")
    op.drop_constraint("uq_carts_owner_user_id", "carts", type_="unique")
    op.drop_index("ix_carts_owner_user_id", table_name="carts")
    op.drop_column("carts", "owner_user_id")

    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
