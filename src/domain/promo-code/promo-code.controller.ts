import { Body, Controller, Post, Request, Route, Security, Tags } from "tsoa";
import { injectable } from "tsyringe";
import { JwtModel, UserRole } from "../auth/auth.dto";


@injectable()
@Route("api/v1/promoCodes")
@Tags("PromoCode")
export class PromoCodeController extends Controller {
  constructor() {
    super();
  }

  @Post("")
  @Security("jwt", [UserRole.MANAGER])
  public async create(
    @Request() req: JwtModel,
    @Body() body: CreatePromoCodeRequest,
  ): Promise<BasicPromoCode> {
  }
}