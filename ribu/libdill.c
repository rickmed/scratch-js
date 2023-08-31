coroutine void worker(void) { ... }
int main(void)
{
	int bndl = bundle();
	bundle_go(bndl, worker());
	bundle_go(bndl, worker());
	bundle_go(bndl, worker());
	hclose(bndl);
	return 0;
}