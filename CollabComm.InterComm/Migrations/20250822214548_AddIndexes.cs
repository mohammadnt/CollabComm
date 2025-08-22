using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CollabComm.InterComm.Migrations
{
    /// <inheritdoc />
    public partial class AddIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_user_role_user_id",
                table: "user_role",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_user_group_user_id_deleted_group_id",
                table: "user_group",
                columns: new[] { "user_id", "deleted", "group_id" });

            migrationBuilder.CreateIndex(
                name: "IX_session_device_id",
                table: "session",
                column: "device_id");

            migrationBuilder.CreateIndex(
                name: "IX_session_user_id_deleted_last_online_date",
                table: "session",
                columns: new[] { "user_id", "deleted", "last_online_date" });

            migrationBuilder.CreateIndex(
                name: "IX_public_user_media_user_id",
                table: "public_user_media",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_conversation_deleted_from_id_to_id",
                table: "conversation",
                columns: new[] { "deleted", "from_id", "to_id" });

            migrationBuilder.CreateIndex(
                name: "IX_contact_user_id_deleted_target_id",
                table: "contact",
                columns: new[] { "user_id", "deleted", "target_id" });

            migrationBuilder.CreateIndex(
                name: "IX_collab_user_username",
                table: "collab_user",
                column: "username");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_user_role_user_id",
                table: "user_role");

            migrationBuilder.DropIndex(
                name: "IX_user_group_user_id_deleted_group_id",
                table: "user_group");

            migrationBuilder.DropIndex(
                name: "IX_session_device_id",
                table: "session");

            migrationBuilder.DropIndex(
                name: "IX_session_user_id_deleted_last_online_date",
                table: "session");

            migrationBuilder.DropIndex(
                name: "IX_public_user_media_user_id",
                table: "public_user_media");

            migrationBuilder.DropIndex(
                name: "IX_conversation_deleted_from_id_to_id",
                table: "conversation");

            migrationBuilder.DropIndex(
                name: "IX_contact_user_id_deleted_target_id",
                table: "contact");

            migrationBuilder.DropIndex(
                name: "IX_collab_user_username",
                table: "collab_user");
        }
    }
}
