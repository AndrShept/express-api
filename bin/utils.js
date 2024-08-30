const { prisma } = require('../prisma/prisma');

const userOnline = async (userId) => {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { isOnline: true },
  });
};

const userOffline = async (userId) => {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { isOnline: false },
  });
};

// const newMessageCount = async ({ conversationId, userId }) => {
//   const conversation = await prisma.conversation.findUnique({
//     where: { id: conversationId },
//     include: { messages: { include: { author: true, conversation: true } } },
//   });

//   const conversationsWithNewMessagesCount = conversation.messages.filter(
//     (message) => message.isRead === false && message.authorId !== userId
//   ).length;

//   return { conversationId, conversationsWithNewMessagesCount };
// };

const onHtml = (url) => {
  return `
  <html dir="ltr" lang="en">
  
  <head>
  
  <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
  <meta name="x-apple-disable-message-reformatting" />
  </head>
  
  <body style="background-color:#f6f9fc;padding:10px 0">
  <table align="center" width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation" style="max-width:37.5em;background-color:#ffffff;border:1px solid #f0f0f0;padding:45px">
  <tbody>
  <tr style="width:100%">
    <td>
      <table align="center" width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation">
        <tbody>
          <tr>
            <td>
          
              <p style="font-size:16px;line-height:26px;margin:16px 0;font-family:'Open Sans', 'HelveticaNeue-Light', 'Helvetica Neue Light', 'Helvetica Neue', Helvetica, Arial, 'Lucida Grande', sans-serif;font-weight:300;color:#404040">Someone recently requested a password change for your account. If this was you, you can set a new password here:</p>
              <a href=${url} style="line-height:100%;text-decoration:none;display:block;max-width:100%;mso-padding-alt:0px;background-color:#007ee6;border-radius:4px;color:#fff;font-family:'Open Sans', 'Helvetica Neue', Arial;font-size:15px;text-align:center;width:210px;padding:14px 7px 14px 7px" target="_blank">
                <span><!--[if mso]><i style="mso-font-width:350%;mso-text-raise:21" hidden>&#8202;</i><![endif]--></span>
                <span style="max-width:100%;display:inline-block;line-height:120%;mso-padding-alt:0px;mso-text-raise:10.5px">Reset password</span>
                <span><!--[if mso]><i style="mso-font-width:350%" hidden>&#8202;&#8203;</i><![endif]--></span>
              </a>
              <p style="font-size:16px;line-height:26px;margin:16px 0;font-family:'Open Sans', 'HelveticaNeue-Light', 'Helvetica Neue Light', 'Helvetica Neue', Helvetica, Arial, 'Lucida Grande', sans-serif;font-weight:300;color:#404040">If you don&#x27;t want to change your password or didn&#x27;t request this, just ignore and delete this message.</p>
              <p style="font-size:16px;line-height:26px;margin:16px 0;font-family:'Open Sans', 'HelveticaNeue-Light', 'Helvetica Neue Light', 'Helvetica Neue', Helvetica, Arial, 'Lucida Grande', sans-serif;font-weight:300;color:#404040">To keep your account secure, please don&#x27;t forward this email to anyone.</p>
            </td>
          </tr>
        </tbody>
      </table>
    </td>
  </tr>
  </tbody>
  </table>
  </body>
  
  </html>
  `;
};

module.exports = {
  userOnline,
  userOffline,
  onHtml,
};
