import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import pick from "../../shared/pick";
import { paginationFileds } from "../../constants/pagination";
import { filterableField } from "../../constants/searchableField";
import { IClient } from "./client.interface";
import { ClientService } from "./client.service";
import { StatusCodes } from "http-status-codes";

import { uploadFileToSpace } from "../../utilitis/uploadTos3";


const createClient = catchAsync(async (req: Request, res: Response) => {
  const data = req.body;

  const { name, email, role, password, ...others } = data;

  const result = await ClientService.createClient(
    { name, email, role, password },
    others
  );
  // console.log(jwtHelpers.verifyToken(result, config.jwt.secret as Secret));
  // console.log(data, "check data");
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: `Client account created successfully`,
    data: result,
  });
});

const getClients = catchAsync(async (req: Request, res: Response) => {
  const paginationOptions = pick(req.query, paginationFileds);
  console.log(req.query, "querty check from controller");
  const filters = pick(req.query, filterableField);
  //  console.log(req.query,"check query")
  const result = await ClientService.getClients(filters, paginationOptions);

  console.log(filters, "filters");
  sendResponse<IClient[]>(res, {
    success: true,
    statusCode: StatusCodes.OK,

    message: "Clients  retrived successfully",
    meta: result.meta,
    data: result.data,
  });
});
const getClientById = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;

  const result = await ClientService.getClientById(id);

  sendResponse<IClient>(res, {
    success: true,
    statusCode: StatusCodes.OK,

    message: "Client   retrived successfully",
    data: result,
  });
});
const updateSingleClient = catchAsync(async (req: Request, res: Response) => {
  const data = req.body;
  const id = req.params.id;
  let projectUrl;
  let profileImageUrl;
  const { name, ...clientProfile } = data;
  const { workSample, profileImage, ...others } = clientProfile;
  let updatedProfile={...others}
  // console.log(req.body);
  const files = req.files as Express.Multer.File[]; // Get all files uploaded
  const fileMap: { [key: string]: Express.Multer.File } = {};
 if(files.length){
  files.forEach((file) => {
    fileMap[file.fieldname] = file;
  });


  // console.log(req.body, "check body");
  // console.log(file, "check file");

  if (fileMap["projectUrl"]) {
    projectUrl = await uploadFileToSpace(
      fileMap["projectUrl"],
      "project-samples"
    );
  }

  if (fileMap["profileUrl"]) {
    profileImageUrl = await uploadFileToSpace(
      fileMap["profileUrl"],
      "profileUrl"
    );
  }
   updatedProfile = {
    ...others,
    projectUrl: projectUrl,
    profileUrl: profileImageUrl,
  };

 }


  // console.log(req.user, "check user");

 

  // Include uploaded file URLs in the update payload
 
  const auth = { name };

  const result = await ClientService.updateSingleClient(
    id,
    auth,
    updatedProfile
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: `client  account  updated    successfully`,
    data: result,
  });
});

export const ClientController = {
  createClient,
  getClients,
  updateSingleClient,
  getClientById,
};
