import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common'
import { JwtAuthGuard, AdminGuard } from '../common/guards/auth.guard'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { AdminUsersService, AdminUserSummary } from './users.service'

@Controller('admin/users')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminUsersController {
  constructor(private readonly usersService: AdminUsersService) {}

  @Get()
  async listUsers(): Promise<AdminUserSummary[]> {
    return this.usersService.listUsers()
  }

  @Post()
  async createUser(@Body() payload: CreateUserDto): Promise<AdminUserSummary> {
    return this.usersService.createUser(payload)
  }

  @Put(':id')
  async updateUser(@Param('id') userId: string, @Body() payload: UpdateUserDto): Promise<AdminUserSummary> {
    return this.usersService.updateUser(userId, payload)
  }

  @Delete(':id')
  async deleteUser(@Param('id') userId: string): Promise<void> {
    await this.usersService.deleteUser(userId)
  }
}

