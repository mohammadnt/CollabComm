using CollabComm;
using CollabComm.InterComm;

var builder = WebApplication.CreateBuilder(args);

var startup = new Startup(builder.Configuration);
startup.ConfigureServices(builder.Services);

var app = builder.Build();
DbInitializer.Initialize(app);
startup.Configure(app, builder.Environment);