package api_test

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"time"

	"github.com/go-chi/chi"
	"github.com/porter-dev/porter/internal/config"
	"github.com/porter-dev/porter/internal/helm"
	"github.com/porter-dev/porter/internal/kubernetes"
	lr "github.com/porter-dev/porter/internal/logger"
	"github.com/porter-dev/porter/internal/repository"
	memory "github.com/porter-dev/porter/internal/repository/memory"
	"github.com/porter-dev/porter/server/api"
	"github.com/porter-dev/porter/server/router"

	sessionstore "github.com/porter-dev/porter/internal/auth"
)

type tester struct {
	app    *api.App
	repo   *repository.Repository
	store  *sessionstore.PGStore
	router *chi.Mux
	req    *http.Request
	rr     *httptest.ResponseRecorder
	cookie *http.Cookie
}

func (t *tester) execute() {
	t.router.ServeHTTP(t.rr, t.req)
}

func (t *tester) reset() {
	t.rr = httptest.NewRecorder()
	t.req = nil
}

func (t *tester) createUserSession(email string, pw string) {
	req, _ := http.NewRequest(
		"POST",
		"/api/users",
		strings.NewReader(`{"email":"`+email+`","password":"`+pw+`"}`),
	)

	t.req = req
	t.execute()

	if cookies := t.rr.Result().Cookies(); len(cookies) > 0 {
		t.cookie = cookies[0]
	}

	t.reset()
}

func newTester(canQuery bool) *tester {
	appConf := config.Conf{
		Debug: true,
		Server: config.ServerConf{
			Port:         8080,
			CookieName:   "porter",
			CookieSecret: []byte("secret"),
			TimeoutRead:  time.Second * 5,
			TimeoutWrite: time.Second * 10,
			TimeoutIdle:  time.Second * 15,
			IsTesting:    true,
		},
		// unimportant here
		Db: config.DBConf{},
		// set the helm config to testing
		K8s: config.K8sConf{
			IsTesting: true,
		},
	}

	logger := lr.NewConsole(appConf.Debug)
	repo := memory.NewRepository(canQuery)
	store, _ := sessionstore.NewStore(repo, appConf.Server)

	app, _ := api.New(&api.AppConfig{
		Logger:     logger,
		Repository: repo,
		ServerConf: appConf.Server,
		TestAgents: &api.TestAgents{
			HelmAgent:             helm.GetAgentTesting(&helm.Form{}, nil, logger),
			HelmTestStorageDriver: helm.StorageMap["memory"](nil, nil, ""),
			K8sAgent:              kubernetes.GetAgentTesting(),
		},
	})

	r := router.New(app)

	return &tester{
		app:    app,
		repo:   repo,
		store:  store,
		router: r,
		req:    nil,
		rr:     httptest.NewRecorder(),
		cookie: nil,
	}
}
