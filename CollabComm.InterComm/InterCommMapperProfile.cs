using AutoMapper;
using CollabComm.InterComm.Models;
using CollabComm.InterComm.MongoModels;
using CollabComm.Models;

namespace CollabComm.InterComm;

public class InterCommMapperProfile : Profile
{
    public InterCommMapperProfile()
    {
        CreateMap<CollabUser, CollabUserInfo>();
        CreateMap<Conversation, ConversationInfo>();
        CreateMap<ChatMedia, ChatMediaInfo>();
        CreateMap<PublicUserMedia, PublicUserMediaInfo>();
        CreateMap<ChatMessage, ChatMessageInfo>();
        CreateMap<Contact, ContactInfo>();
        CreateMap<UserGroup, UserGroupInfo>();
        CreateMap<Session, SessionInfo>();
    }
}