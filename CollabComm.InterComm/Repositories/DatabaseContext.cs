using CollabComm.InterComm.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace CollabComm.InterComm.Repositories;

public class DatabaseContext : IdentityDbContext
{
    public virtual DbSet<Error> error { get; set; }
    public virtual DbSet<CollabUser> collab_user { get; set; }
    public virtual DbSet<Session> session { get; set; }
    public virtual DbSet<Role> role { get; set; }
    public virtual DbSet<UserRole> user_role { get; set; }
    public virtual DbSet<Conversation> conversation { get; set; }
    public virtual DbSet<UserGroup> user_group { get; set; }
    public virtual DbSet<Contact> contact { get; set; }
        

    public DatabaseContext(DbContextOptions<DatabaseContext> options) : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.Entity<Error>()
            .Property(e => e.creation_date)
            .HasDefaultValueSql("CURRENT_TIMESTAMP");
        modelBuilder.Entity<CollabUser>()
            .Property(e => e.creation_date)
            .HasDefaultValueSql("CURRENT_TIMESTAMP");
        modelBuilder.Entity<Session>()
            .Property(e => e.creation_date)
            .HasDefaultValueSql("CURRENT_TIMESTAMP");
        modelBuilder.Entity<Session>()
            .Property(e => e.last_online_date)
            .HasDefaultValueSql("CURRENT_TIMESTAMP");
        modelBuilder.Entity<Role>()
            .Property(e => e.creation_date)
            .HasDefaultValueSql("CURRENT_TIMESTAMP");
        modelBuilder.Entity<UserRole>()
            .Property(e => e.creation_date)
            .HasDefaultValueSql("CURRENT_TIMESTAMP");
        modelBuilder.Entity<Conversation>()
            .Property(e => e.creation_date)
            .HasDefaultValueSql("CURRENT_TIMESTAMP");
        modelBuilder.Entity<Conversation>()
            .Property(e => e.last_message_date)
            .HasDefaultValueSql("CURRENT_TIMESTAMP");
        modelBuilder.Entity<UserGroup>()
            .Property(e => e.creation_date)
            .HasDefaultValueSql("CURRENT_TIMESTAMP");
        modelBuilder.Entity<Contact>()
            .Property(e => e.creation_date)
            .HasDefaultValueSql("CURRENT_TIMESTAMP");
    }
}