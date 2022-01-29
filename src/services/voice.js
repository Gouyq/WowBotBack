export default {
    createVocalBoost(channels, channelName, parent, userLimit, cb){
        channels.create(channelName, {
            type: 'voice'
          }).then((channel) => {
            channel.setParent(parent)
            channel.setUserLimit(userLimit);
            channel.createInvite()
              .then(async (invite) => {  cb(channel, invite.code)})
          })
    },
    deleteVocal(channel, timer){
        setTimeout(() => {
            channel.delete();
          }, timer)
    }
}