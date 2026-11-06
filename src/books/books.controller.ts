import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { BooksService } from './books.service.js';
import { CreateBookDto } from './dto/create-book.dto.js';
import { UpdateBookDto } from './dto/update-book.dto.js';

@Controller('books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Get()
  findAll(@Query('author') author?: string) {
    return this.booksService.findAll(author);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.booksService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateBookDto) {
    return this.booksService.create(dto);
  }

  @Put(':id')
  replace(@Param('id', ParseIntPipe) id: number, @Body() dto: CreateBookDto) {
    return this.booksService.replace(id, dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateBookDto) {
    return this.booksService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.booksService.remove(id);
  }
}
