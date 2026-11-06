import { Injectable, NotFoundException } from '@nestjs/common';
import { definedOnly, JsonFileStore } from '../common/json-file-store.js';
import { Book } from './book.entity.js';
import { CreateBookDto } from './dto/create-book.dto.js';
import { UpdateBookDto } from './dto/update-book.dto.js';

@Injectable()
export class BooksService {
  private readonly store = new JsonFileStore<Book>('books.json');

  async findAll(author?: string): Promise<Book[]> {
    const books = await this.store.readAll();
    if (!author) return books;
    const term = author.toLowerCase();
    return books.filter((b) => b.author.toLowerCase().includes(term));
  }

  async findOne(id: number): Promise<Book> {
    const books = await this.store.readAll();
    const book = books.find((b) => b.id === id);
    if (!book) throw new NotFoundException(`Livro ${id} não encontrado`);
    return book;
  }

  create(dto: CreateBookDto): Promise<Book> {
    return this.store.mutate((books) => {
      const now = new Date().toISOString();
      const book: Book = {
        id: JsonFileStore.nextId(books),
        ...this.fromDto(dto),
        createdAt: now,
        updatedAt: now,
      };
      books.push(book);
      return book;
    });
  }

  /** PUT: substitui o livro inteiro. Campos não enviados voltam ao padrão. */
  replace(id: number, dto: CreateBookDto): Promise<Book> {
    return this.store.mutate((books) => {
      const index = this.indexOrFail(books, id);
      const book: Book = {
        id,
        ...this.fromDto(dto),
        createdAt: books[index].createdAt,
        updatedAt: new Date().toISOString(),
      };
      books[index] = book;
      return book;
    });
  }

  /** PATCH: altera apenas os campos enviados. */
  update(id: number, dto: UpdateBookDto): Promise<Book> {
    return this.store.mutate((books) => {
      const index = this.indexOrFail(books, id);
      const book: Book = {
        ...books[index],
        ...definedOnly(dto),
        id,
        updatedAt: new Date().toISOString(),
      };
      books[index] = book;
      return book;
    });
  }

  remove(id: number): Promise<Book> {
    return this.store.mutate((books) => {
      const index = this.indexOrFail(books, id);
      const [removed] = books.splice(index, 1);
      return removed;
    });
  }

  private fromDto(dto: CreateBookDto) {
    return {
      title: dto.title,
      author: dto.author,
      year: dto.year ?? null,
      genre: dto.genre ?? '',
      read: dto.read ?? false,
    };
  }

  private indexOrFail(books: Book[], id: number): number {
    const index = books.findIndex((b) => b.id === id);
    if (index === -1) throw new NotFoundException(`Livro ${id} não encontrado`);
    return index;
  }
}
