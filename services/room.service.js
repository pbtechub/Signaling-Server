// const { rooms } = require("../store/room.store");

// const addUser = (roomId, user) => {
//   if (!rooms[roomId]) {
//     rooms[roomId] = [];
//   }

//   const alreadyExists = rooms[roomId].find((u) => u.role === user.role);

//   if (alreadyExists) {
//     alreadyExists.id = user.id;
//     alreadyExists.joinedAt = Date.now();

//     return;
//   }

//   rooms[roomId].push(user);
// };

// const removeUser = (roomId, socketId) => {
//   if (!rooms[roomId]) return;

//   rooms[roomId] = rooms[roomId].filter((u) => u.id !== socketId);

//   if (rooms[roomId].length === 0) {
//     delete rooms[roomId];
//   }
// };

// const getUsers = (roomId) => {
//   return rooms[roomId] || [];
// };

// module.exports = {
//   addUser,
//   removeUser,
//   getUsers,
// };

const { rooms } = require("../store/room.store");


const addUser = (roomId, user) => {


  if(!rooms[roomId]){

    rooms[roomId] = [];

  }



  const alreadyJoined =
    rooms[roomId].find(
      item => item.role === user.role
    );



  if(alreadyJoined){

    return {
      success:false,
      message:`${user.role} already joined`
    };

  }



  rooms[roomId].push(user);



  return {
    success:true,
    users:rooms[roomId]
  };

};




const removeUser = (
  roomId,
  socketId
)=>{


  if(!rooms[roomId]){
    return;
  }



  rooms[roomId] =
    rooms[roomId].filter(
      user => user.id !== socketId
    );



  if(
    rooms[roomId].length === 0
  ){

    delete rooms[roomId];

  }

};




const getUsers = (roomId)=>{


  return rooms[roomId] || [];


};




module.exports={
  addUser,
  removeUser,
  getUsers,
  removeUser
};
