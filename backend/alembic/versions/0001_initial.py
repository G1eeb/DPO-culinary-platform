"""initial

Revision ID: 0001
Revises:
Create Date: 2026-01-01 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # users
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("username", sa.String(50), nullable=False, unique=True),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("role", sa.Enum("user", "admin", name="userrole"), nullable=False, server_default="user"),
        sa.Column("avatar_url", sa.String(500)),
        sa.Column("cover_url", sa.String(500)),
        sa.Column("bio", sa.Text()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # recipes
    op.create_table(
        "recipes",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("description", sa.Text()),
        sa.Column("cook_time", sa.Integer()),
        sa.Column("servings", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("cover_url", sa.String(500)),
        sa.Column("cuisine", sa.Enum("italian", "japanese", "russian", "french", "mexican",
                                     "chinese", "indian", "georgian", "mediterranean", "american", "other",
                                     name="cuisine"), nullable=False, server_default="other"),
        sa.Column("category", sa.Enum("breakfast", "soups", "main", "salads", "desserts",
                                      "baking", "snacks", "drinks", "sauces", "other",
                                      name="category"), nullable=False, server_default="other"),
        sa.Column("difficulty", sa.Enum("easy", "medium", "hard", name="difficulty"),
                  nullable=False, server_default="easy"),
        sa.Column("author_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("search_vector", postgresql.TSVECTOR()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_recipes_search_vector", "recipes", ["search_vector"], postgresql_using="gin")

    # tags
    op.create_table(
        "tags",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(50), nullable=False, unique=True),
    )

    # recipe_tags
    op.create_table(
        "recipe_tags",
        sa.Column("recipe_id", sa.Integer(), sa.ForeignKey("recipes.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("tag_id", sa.Integer(), sa.ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
    )

    # ingredients
    op.create_table(
        "ingredients",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("recipe_id", sa.Integer(), sa.ForeignKey("recipes.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("amount", sa.Numeric(10, 2)),
        sa.Column("unit", sa.String(30)),
    )

    # steps
    op.create_table(
        "steps",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("recipe_id", sa.Integer(), sa.ForeignKey("recipes.id", ondelete="CASCADE"), nullable=False),
        sa.Column("order", sa.Integer(), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("photo_url", sa.String(500)),
    )

    # ratings
    op.create_table(
        "ratings",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("recipe_id", sa.Integer(), sa.ForeignKey("recipes.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("score", sa.Integer(), nullable=False),
        sa.CheckConstraint("score >= 1 AND score <= 5", name="ck_rating_score"),
        sa.UniqueConstraint("recipe_id", "user_id", name="uq_rating_recipe_user"),
    )

    # comments
    op.create_table(
        "comments",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("recipe_id", sa.Integer(), sa.ForeignKey("recipes.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("parent_id", sa.Integer(), sa.ForeignKey("comments.id", ondelete="CASCADE")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # favorites
    op.create_table(
        "favorites",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("recipe_id", sa.Integer(), sa.ForeignKey("recipes.id", ondelete="CASCADE"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("user_id", "recipe_id", name="uq_favorite_user_recipe"),
    )

    # follows
    op.create_table(
        "follows",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("follower_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("following_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("follower_id", "following_id", name="uq_follow"),
    )

    # notifications
    op.create_table(
        "notifications",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("from_user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL")),
        sa.Column("recipe_id", sa.Integer(), sa.ForeignKey("recipes.id", ondelete="SET NULL")),
        sa.Column("type", sa.Enum("like", "comment", "follow", "reply", name="notificationtype"), nullable=False),
        sa.Column("is_read", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Триггер для автообновления search_vector
    op.execute("""
        CREATE OR REPLACE FUNCTION update_recipe_search_vector()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.search_vector :=
                setweight(to_tsvector('russian', coalesce(NEW.title, '')), 'A') ||
                setweight(to_tsvector('russian', coalesce(NEW.description, '')), 'B');
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    """)
    op.execute("""
        CREATE TRIGGER trg_recipe_search_vector
        BEFORE INSERT OR UPDATE ON recipes
        FOR EACH ROW EXECUTE FUNCTION update_recipe_search_vector();
    """)


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS trg_recipe_search_vector ON recipes")
    op.execute("DROP FUNCTION IF EXISTS update_recipe_search_vector")
    op.drop_table("notifications")
    op.drop_table("follows")
    op.drop_table("favorites")
    op.drop_table("comments")
    op.drop_table("ratings")
    op.drop_table("steps")
    op.drop_table("ingredients")
    op.drop_table("recipe_tags")
    op.drop_table("tags")
    op.drop_table("recipes")
    op.drop_table("users")
    op.execute("DROP TYPE IF EXISTS notificationtype")
    op.execute("DROP TYPE IF EXISTS difficulty")
    op.execute("DROP TYPE IF EXISTS category")
    op.execute("DROP TYPE IF EXISTS cuisine")
    op.execute("DROP TYPE IF EXISTS userrole")
